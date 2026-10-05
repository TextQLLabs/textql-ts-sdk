import { watchChat, type StreamEvent } from '@ui/lib/api';
import { getCellCase, getCellPayload, isCellExecuting, settleCells, type CellLike } from '@ui/lib/cells';
import { Store, useStore } from '@ui/lib/store';
import { isRecord } from '@ui/lib/utils';

import { getRun, startRun, updateRun, uploadFile, type ForecastBody } from './api';
import { parseCsvSource, parseWorkbook, type Sheet } from './csv';
import { MAX_UPLOAD_BYTES } from './files';
import { COLUMNS, SCENARIO_LABEL, scopeRules, type ForecastParams } from './forecast';

export type Phase = 'idle' | 'loading' | 'uploading' | 'preparing' | 'running' | 'done' | 'error';

/** One forecast request and the agent's cells answering it. */
export type Turn = { key: string; params: ForecastParams; cells: CellLike[] };

export type RunState = {
	/** The local file, loaded once; a new session keeps it. */
	data: Sheet | null;
	dataError: string | null;
	chatId: string | null;
	params: ForecastParams | null;
	phase: Phase;
	/** 0–1 while the file is uploading. */
	uploadProgress: number;
	turns: Turn[];
	error: string | null;
};

const SESSION = {
	chatId: null,
	params: null,
	phase: 'idle' as Phase,
	uploadProgress: 0,
	turns: [] as Turn[],
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

function forecastBody(data: Sheet, params: ForecastParams): ForecastBody {
	return {
		rules: scopeRules(data, params),
		measure: COLUMNS.amount,
		scenario: SCENARIO_LABEL[params.scenario],
		forecast_from: params.forecast.from,
		forecast_to: params.forecast.to,
		parameters: params
	};
}

class RunStore extends Store<RunState> {
	#abort: AbortController | null = null;

	constructor() {
		super({ data: null, dataError: null, ...SESSION });
	}

	/** Load the local file the dev server serves (see DATA_FILE in vite.config.ts). */
	loadData() {
		if (this.state.data || this.state.dataError) return;
		const sheet = /\.(csv|tsv|txt)$/i.test(__DATA_NAME__)
			? parseCsvSource(__DATA_URL__)
			: fetch(__DATA_URL__)
					.then((response) => response.arrayBuffer())
					.then(parseWorkbook);
		sheet
			.then((data) => this.set({ data }))
			.catch((err: unknown) => this.set({ dataError: message(err) }));
	}

	reset() {
		this.#abort?.abort();
		this.#abort = null;
		this.set(SESSION);
	}

	#begin(): AbortController {
		this.#abort?.abort();
		const abort = new AbortController();
		this.#abort = abort;
		return abort;
	}

	#patchTurn(update: (cells: CellLike[]) => CellLike[]) {
		this.set((s) => {
			const last = s.turns[s.turns.length - 1];
			if (!last) return {};
			return { turns: [...s.turns.slice(0, -1), { ...last, cells: update(last.cells) }] };
		});
	}

	#finish(patch: Partial<RunState>) {
		this.#patchTurn((cells) => {
			const settled = cells.map((c) => ({ ...c }));
			settleCells(settled);
			return settled;
		});
		this.set(patch);
	}

	#onEvent = (event: StreamEvent) => {
		switch (event.type) {
			case 'cell': {
				const cell = event.cell;
				if (!isRecord(cell) || isUserProse(cell) || isBookkeeping(cell)) return;
				this.#patchTurn((cells) => {
					const index = cells.findIndex((c) => c.id === cell.id);
					if (index === -1) return [...cells, cell];
					const next = cells.slice();
					next[index] = cell;
					return next;
				});
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

	#lastCellId(): string {
		for (let t = this.state.turns.length - 1; t >= 0; t--) {
			const cells = this.state.turns[t]!.cells;
			const id = cells[cells.length - 1]?.id;
			if (typeof id === 'string' && id) return id;
		}
		return '';
	}

	/**
	 * Forecast with these parameters. The first one uploads the file and opens
	 * the chat; later ones are follow-up turns in that chat.
	 */
	async apply(params: ForecastParams, onChat: (chatId: string) => void) {
		const data = this.state.data;
		if (!data) return;
		const abort = this.#begin();
		const body = forecastBody(data, params);
		const chatId = this.state.chatId;
		const latestCellId = this.#lastCellId();
		this.set((s) => ({
			params,
			error: null,
			turns: [...s.turns, { key: `turn-${s.turns.length}-${Date.now()}`, params, cells: [] }]
		}));
		try {
			if (chatId) {
				this.set({ phase: 'running' });
				await updateRun(chatId, { ...body, latest_cell_id: latestCellId }, this.#onEvent, abort.signal);
			} else {
				this.set({ phase: 'uploading', uploadProgress: 0 });
				const blob = await (await fetch(__DATA_URL__, { signal: abort.signal })).blob();
				if (blob.size > MAX_UPLOAD_BYTES) throw new Error('The data file is larger than 100 MB.');
				const file = new File([blob], __DATA_NAME__);
				const datasetId = await uploadFile(
					file,
					(fraction) => this.set({ uploadProgress: fraction }),
					abort.signal
				);
				this.set({ phase: 'preparing' });
				await startRun(
					{ ...body, dataset_id: datasetId, file_name: file.name },
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
			}
			if (this.state.phase === 'running') this.#finish({ phase: 'done' });
		} catch (err) {
			if (!abort.signal.aborted) this.#finish({ phase: 'error', error: message(err) });
		}
	}

	/** Rebuild a session's forecasts from TextQL's history. */
	async open(chatId: string) {
		if (this.state.chatId === chatId && this.state.phase !== 'error') return;
		const abort = this.#begin();
		this.set({ ...SESSION, chatId, phase: 'loading' });
		try {
			const detail = await getRun(chatId, abort.signal);
			if (abort.signal.aborted) return;
			const prompts = new Map(detail.prompts.map((p) => [p.cell_id, p.parameters]));
			const turns: Turn[] = [];
			for (const cell of detail.cells) {
				const params = typeof cell.id === 'string' ? prompts.get(cell.id) : undefined;
				if (params) turns.push({ key: String(cell.id), params, cells: [] });
				else if (!isUserProse(cell) && !isBookkeeping(cell)) turns[turns.length - 1]?.cells.push(cell);
			}
			const live = turns.some((t) => t.cells.some((c) => isCellExecuting(c)));
			this.set({
				turns,
				params: turns[turns.length - 1]?.params ?? null,
				phase: live ? 'running' : 'done'
			});
			if (live) {
				await watchChat(chatId, {
					latestCellId: this.#lastCellId(),
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
