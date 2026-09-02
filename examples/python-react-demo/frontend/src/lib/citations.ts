import { asRecords, asString, asStrings, getCellPayload, getCellToolSummary, type CellLike } from './cells';

/**
 * Citations ride along on a markdown cell: the agent writes inline
 * `[[tqlcite …]]` markers, the API strips them out of `content` before the
 * delta ships, and what reaches us is this list plus the `anchor` text each one
 * was attached to. Placing the numbered marker back into the rendered prose is
 * therefore a client job — see `citationMarkers.ts`.
 */
export type CitationLineageNode = {
	cellId: string;
	/** "sql" | "python" */
	kind: string;
	dataframeName: string;
	connectorId?: number;
	tables: string[];
};

export type Citation = {
	id: string;
	claim: string;
	sourceCellId: string;
	/** Tail of the sentence the claim ends on; where the marker goes. */
	anchor: string;
	quotedText: string;
	rationale: string;
	lineage: CitationLineageNode[];
};

/** A citation plus what the UI shows around it. */
export type CitationView = Citation & {
	key: string;
	/** The answer this citation belongs to, for grouping the chat-wide list. */
	cellId: string;
	/** 1-based; the number drawn in the inline marker. */
	marker: number;
	/** Summary of the cell that produced the figure, when it is still in the turn. */
	sourceSummary: string;
	/** First SQL connector in the lineage — the source's real origin. */
	connectorId?: number;
};

function asNumber(value: unknown): number | undefined {
	return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function toLineageNode(node: Record<string, unknown>): CitationLineageNode {
	return {
		cellId: asString(node.cellId),
		kind: asString(node.kind),
		dataframeName: asString(node.dataframeName),
		connectorId: asNumber(node.connectorId),
		tables: asStrings(node.tables)
	};
}

function toCitation(raw: Record<string, unknown>): Citation {
	return {
		id: asString(raw.id),
		claim: asString(raw.claim),
		sourceCellId: asString(raw.sourceCellId),
		anchor: asString(raw.anchor),
		quotedText: asString(raw.quotedText),
		rationale: asString(raw.rationale),
		lineage: asRecords(raw.lineage).map(toLineageNode)
	};
}

const EMPTY: Citation[] = [];
const CITATIONS = new WeakMap<CellLike, Citation[]>();

/**
 * Memoized per cell object so the coerced array keeps its identity across the
 * renders one stream event triggers — the marker decoration is keyed on it.
 */
export function getCitations(cell: CellLike): Citation[] {
	const cached = CITATIONS.get(cell);
	if (cached) return cached;
	const raw = asRecords(getCellPayload(cell).citations);
	const list = raw.length > 0 ? raw.map(toCitation) : EMPTY;
	CITATIONS.set(cell, list);
	return list;
}

/** Stable identity for one citation, whether or not the API assigned it an id. */
export function citationKey(citation: Citation, cellId: string, index: number): string {
	return citation.id || `${cellId}:${index}`;
}

function sqlConnectorId(citation: Citation): number | undefined {
	return citation.lineage.find((node) => node.kind === 'sql' && node.connectorId !== undefined)
		?.connectorId;
}

const EMPTY_VIEWS: CitationView[] = [];

/**
 * `turnCells` is the whole assistant turn, which is where the producing cell's
 * summary comes from: a citation names its source cell by id, not by title.
 */
export function buildCitationViews(cell: CellLike, turnCells: CellLike[]): CitationView[] {
	const citations = getCitations(cell);
	if (citations.length === 0) return EMPTY_VIEWS;
	const cellId = asString(cell.id);
	return citations.map((citation, index) => {
		const source = citation.sourceCellId
			? turnCells.find((candidate) => candidate.id === citation.sourceCellId)
			: undefined;
		return {
			...citation,
			key: citationKey(citation, cellId, index),
			cellId,
			marker: index + 1,
			sourceSummary: (source && getCellToolSummary(source)) || '',
			connectorId: sqlConnectorId(citation)
		};
	});
}

/** Every citation in the chat, in transcript order. */
export function collectCitations(cells: CellLike[]): CitationView[] {
	return cells.flatMap((cell) => buildCitationViews(cell, cells));
}

/** Fallback label when no connector resolves: the kinds of work behind the claim. */
export function lineageKindLabel(citation: Citation): string {
	if (citation.lineage.some((node) => node.kind === 'sql')) return 'SQL';
	if (citation.lineage.some((node) => node.kind === 'python')) return 'Python';
	return 'Source';
}

/** Tables and dataframes the claim passed through, deduped, in lineage order. */
export function lineageTrail(citation: Citation): string[] {
	const seen = new Set<string>();
	for (const node of citation.lineage) {
		for (const table of node.tables) seen.add(table);
		if (node.dataframeName) seen.add(node.dataframeName);
	}
	return [...seen];
}
