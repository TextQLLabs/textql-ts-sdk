import { watchChat, type StreamEvent } from '@ui/lib/api';
import { getCellCase, getCellPayload, isCellExecuting, settleCells, type CellLike } from '@ui/lib/cells';
import { Store, useStore } from '@ui/lib/store';
import { isRecord } from '@ui/lib/utils';

import { datasetFileUrl, fetchDatasetValues, getRun, startRun, uploadFile } from './api';
import { buildSheet, parseCsvSource, type Sheet } from './csv';
import { isTextTable } from './files';

export type Phase = 'idle' | 'loading' | 'uploading' | 'preparing' | 'running' | 'done' | 'error';

export type RunState = {
	chatId: string | null;
	fileName: string;
	/** The parsed input; null while it is still being read or fetched. */
	input: Sheet | null;
	inputError: string | null;
	instruction: string;
	phase: Phase;
	/** 0–1 while the file is uploading. */
	uploadProgress: number;
	/** The agent's cells only: no echoed prompt, upload cell, or title cell. */
	cells: CellLike[];
	error: string | null;
};

const IDLE: RunState = {
	chatId: null,
	fileName: '',
	input: null,
	inputError: null,
	instruction: '',
	phase: 'idle',
	uploadProgress: 0,
	cells: [],
	error: null
};

function isUserProse(cell: CellLike): boolean {
	const cellCase = getCellCase(cell);
	return (cellCase === 'mdCell' || cellCase === 'ansCell') && cell.generated !== true;
}

function isBookkeeping(cell: CellLike): boolean {
	if (getCellCase(cell) === 'summaryCell') return true;
	return cell.generated !== true && Boolean(getCellPayload(cell).datasetSourceId);
}

function message(err: unknown): string {
	return err instanceof Error ? err.message : String(err);
}

class RunStore extends Store<RunState> {
	#abort: AbortController | null = null;

	constructor() {
		super(IDLE);
	}

	reset() {
		this.#abort?.abort();
		this.#abort = null;
		this.set(IDLE);
	}

	#upsert(cell: CellLike) {
		this.set((s) => {
			const index = s.cells.findIndex((c) => c.id === cell.id);
			if (index === -1) return { cells: [...s.cells, cell] };
			const next = s.cells.slice();
			next[index] = cell;
			return { cells: next };
		});
	}

	#finish(patch: Partial<RunState>) {
		this.set((s) => {
			const cells = s.cells.map((c) => ({ ...c }));
			settleCells(cells);
			return { cells, ...patch };
		});
	}

	#onEvent = (event: StreamEvent) => {
		switch (event.type) {
			case 'cell': {
				const cell = event.cell;
				if (!isRecord(cell)) return;
				if (isUserProse(cell) || isBookkeeping(cell)) return;
				this.#upsert(cell);
				return;
			}
			case 'runStarted':
				this.set({ phase: 'running' });
				return;
			case 'runComplete':
				this.#finish({ phase: 'done' });
				return;
			case 'runError': {
				const error = isRecord(event.runError) ? event.runError : {};
				this.#finish({
					phase: 'error',
					error: (typeof error.error === 'string' && error.error) || 'The agent run failed.'
				});
				return;
			}
			case 'timeout':
				this.#finish({ phase: 'error', error: 'The stream went quiet. Reopen the run to catch up.' });
				return;
			default:
				return;
		}
	};

	#loadInput(sheet: Promise<Sheet>, abort: AbortController) {
		sheet
			.then((value) => !abort.signal.aborted && this.set({ input: value }))
			.catch((err: unknown) => !abort.signal.aborted && this.set({ inputError: message(err) }));
	}

	/** An uploaded dataset as a sheet: its own bytes for CSV/TSV, TextQL's parse otherwise. */
	#loadDataset(datasetId: string, fileName: string, abort: AbortController) {
		const sheet = isTextTable(fileName)
			? datasetFileUrl(datasetId, abort.signal).then(parseCsvSource)
			: fetchDatasetValues(datasetId, abort.signal).then((v) =>
					buildSheet(v.columns, v.rows, v.truncated)
				);
		this.#loadInput(sheet, abort);
	}

	#begin(patch: Partial<RunState>): AbortController {
		this.reset();
		const abort = new AbortController();
		this.#abort = abort;
		this.set({ ...IDLE, ...patch });
		return abort;
	}

	/** Upload the file, then stream the run; the backend creates and prepares the chat. */
	async start(file: File, instruction: string, onChat: (chatId: string) => void) {
		const abort = this.#begin({ fileName: file.name, instruction, phase: 'uploading' });
		if (isTextTable(file.name)) this.#loadInput(parseCsvSource(file), abort);
		try {
			const datasetId = await uploadFile(
				file,
				(fraction) => this.set({ uploadProgress: fraction }),
				abort.signal
			);
			if (!isTextTable(file.name)) this.#loadDataset(datasetId, file.name, abort);
			this.set({ phase: 'preparing' });
			await startRun(
				{ dataset_id: datasetId, file_name: file.name, instruction },
				(event) => {
					// The backend's first event names the chat it created.
					if (event.type === 'opened' && typeof event.chatId === 'string' && !this.state.chatId) {
						this.set({ chatId: event.chatId });
						onChat(event.chatId);
						return;
					}
					this.#onEvent(event);
				},
				abort.signal
			);
			if (this.state.phase === 'running') this.#finish({ phase: 'done' });
		} catch (err) {
			if (!abort.signal.aborted) this.#finish({ phase: 'error', error: message(err) });
		}
	}

	/** Rebuild a finished (or still running) run from TextQL's history. */
	async open(chatId: string) {
		if (this.state.chatId === chatId && this.state.phase !== 'error') return;
		const abort = this.#begin({ chatId, phase: 'loading' });
		try {
			const detail = await getRun(chatId, abort.signal);
			if (abort.signal.aborted) return;
			const cells = detail.cells.filter((c) => !isUserProse(c) && !isBookkeeping(c));
			const live = cells.some((c) => isCellExecuting(c));
			this.set({
				fileName: detail.file_name,
				instruction: detail.instruction,
				cells,
				phase: live ? 'running' : 'done'
			});
			if (detail.dataset_id) this.#loadDataset(detail.dataset_id, detail.file_name, abort);
			else this.set({ inputError: 'This run has no input file.' });
			if (live) {
				const last = cells[cells.length - 1];
				await watchChat(chatId, {
					latestCellId: typeof last?.id === 'string' ? last.id : '',
					signal: abort.signal,
					onEvent: this.#onEvent
				});
			}
		} catch (err) {
			if (!abort.signal.aborted) this.set({ phase: 'error', error: message(err) });
		}
	}
}

export const run = new RunStore();

export function useRun(): RunState {
	return useStore(run);
}
