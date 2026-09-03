import { asRecords, asString, asStrings, getCellPayload, getCellToolSummary, type CellLike } from './cells';

/**
 * The API strips the agent's inline `[[tqlcite …]]` markers out of `content`
 * and sends this instead, so re-placing them is a client job (citationMarkers).
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

export type CitationView = Citation & {
	key: string;
	/** The answer this citation belongs to, for grouping the chat-wide list. */
	cellId: string;
	/** 1-based; the number drawn in the inline marker. */
	marker: number;
	/** Producing cell's summary; empty when that cell is outside the turn. */
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

/** Memoized per cell: the marker decoration is keyed on the array's identity,
 *  which must survive the renders one stream event triggers. */
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

/** `turnCells` resolves `sourceCellId` to a summary — a citation names its
 *  producing cell by id, not by title. */
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

export function collectCitations(cells: CellLike[]): CitationView[] {
	return cells.flatMap((cell) => buildCitationViews(cell, cells));
}

/** Fallback label when no connector resolves: the kinds of work behind the claim. */
export function lineageKindLabel(citation: Citation): string {
	if (citation.lineage.some((node) => node.kind === 'sql')) return 'SQL';
	if (citation.lineage.some((node) => node.kind === 'python')) return 'Python';
	return 'Source';
}

export function lineageTrail(citation: Citation): string[] {
	const seen = new Set<string>();
	for (const node of citation.lineage) {
		for (const table of node.tables) seen.add(table);
		if (node.dataframeName) seen.add(node.dataframeName);
	}
	return [...seen];
}
