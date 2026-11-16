import {
	getCellCase,
	getCellContent,
	getCellPayload,
	getCellStartedAtMs,
	getCellToolSummary,
	getCellTypeInfo,
	getToolDisplayName,
	type CellLike,
	type IconComponent
} from './cells';

/**
 * Cells are all the demo has (the product also pulls per-completion LLM timings
 * over RPC), so a step lasts its `executionTimeMs`, else the gap to the next cell.
 */

/** Matches the product's lanes: LLM indigo, queries green, tools amber. */
export type StepKind = 'llm' | 'query' | 'tool';

export const STEP_KIND_COLOR: Record<StepKind, string> = {
	llm: '#6366f1',
	query: '#10b981',
	tool: '#f59e0b'
};

export const STEP_KIND_LABEL: Record<StepKind, string> = {
	llm: 'LLM',
	query: 'Queries',
	tool: 'Tools'
};

export type TimelineStep = {
	id: string;
	kind: StepKind;
	icon: IconComponent;
	label: string;
	detail: string;
	durationMs: number;
	/** Offset from the start of the run, with idle time squeezed out. */
	startMs: number;
	failed: boolean;
};

export type TimelineTurn = {
	id: string;
	question: string;
	steps: TimelineStep[];
	durationMs: number;
	byKind: Record<StepKind, number>;
	failed: boolean;
};

export type Timeline = {
	turns: TimelineTurn[];
	/** Total active time; bars are laid end-to-end, never against wall clock. */
	totalMs: number;
	stepCount: number;
	byKind: Record<StepKind, number>;
};

const QUERY_CASES = new Set(['sqlCell', 'tableauSqlCell', 'daxCell', 'ontologyQueryCell']);
const LLM_CASES = new Set(['thinkingCell']);
/** Prose: the answer itself is not a step. */
const PROSE_CASES = new Set(['mdCell', 'ansCell', 'textCell']);

function zeroed(): Record<StepKind, number> {
	return { llm: 0, query: 0, tool: 0 };
}

function stepKind(cellCase: string): StepKind {
	if (LLM_CASES.has(cellCase)) return 'llm';
	if (QUERY_CASES.has(cellCase)) return 'query';
	return 'tool';
}

function reportedMs(cell: CellLike): number {
	const value = getCellPayload(cell).executionTimeMs ?? cell.durationMs;
	const ms = typeof value === 'string' ? Number(value) : value;
	return typeof ms === 'number' && Number.isFinite(ms) && ms > 0 ? ms : 0;
}

function isUserMessage(cell: CellLike, cellCase: string): boolean {
	return PROSE_CASES.has(cellCase) && cell.generated !== true;
}

export function buildTimeline(cells: CellLike[]): Timeline {
	const turns: TimelineTurn[] = [];
	let current: TimelineTurn | null = null;
	let cursor = 0;

	const openTurn = (id: string, question: string) => {
		current = {
			id,
			question,
			steps: [],
			durationMs: 0,
			byKind: zeroed(),
			failed: false
		};
		turns.push(current);
		return current;
	};

	cells.forEach((cell, index) => {
		const cellCase = getCellCase(cell);
		if (!cellCase) return;

		if (isUserMessage(cell, cellCase)) {
			openTurn(String(cell.id || `turn-${index}`), getCellContent(cell));
			return;
		}
		if (PROSE_CASES.has(cellCase)) return;

		// Cells before the first user message still belong to a turn.
		const turn = current ?? openTurn(`turn-${index}`, '');

		// The gap stands in for cells that don't report their own duration; it is
		// only meaningful up to the next cell in the same turn.
		const next = cells[index + 1];
		const nextCase = next ? getCellCase(next) : undefined;
		const startedAt = getCellStartedAtMs(cell);
		const nextStartedAt = next ? getCellStartedAtMs(next) : null;
		const gapMs =
			startedAt !== null &&
			nextStartedAt !== null &&
			nextStartedAt > startedAt &&
			!(next && nextCase && isUserMessage(next, nextCase))
				? nextStartedAt - startedAt
				: 0;

		const durationMs = reportedMs(cell) || gapMs;
		const kind = stepKind(cellCase);
		const failed = typeof cell.execError === 'string' && cell.execError !== '';

		turn.steps.push({
			id: String(cell.id || `${cellCase}-${index}`),
			kind,
			icon: getCellTypeInfo(cellCase).icon,
			label: getToolDisplayName(cell),
			detail: getCellToolSummary(cell) ?? '',
			durationMs,
			startMs: cursor,
			failed
		});
		cursor += durationMs;
		turn.durationMs += durationMs;
		turn.byKind[kind] += durationMs;
		turn.failed = turn.failed || failed;
	});

	const byKind = zeroed();
	let stepCount = 0;
	for (const turn of turns) {
		stepCount += turn.steps.length;
		for (const kind of Object.keys(byKind) as StepKind[]) byKind[kind] += turn.byKind[kind];
	}

	return { turns, totalMs: cursor, stepCount, byKind };
}
