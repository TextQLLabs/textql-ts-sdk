import { asString, asStrings, getCellCase, getCellPayload, type CellLike } from './cells';
import type { Citation } from './citations';

/** What the lineage inspector shows for one cell: the code it ran and what came back. */
export type CellCodeDetail = {
	kind: string;
	fileName: string;
	lang: string;
	inputLabel: string;
	code: string;
	outputLabel: string;
	/** `dataframe` is the server's markdown-table preview; `text` is plain stdout. */
	outputFormat: 'dataframe' | 'text';
	output: string;
};

export function cellCodeDetail(cell: CellLike | undefined): CellCodeDetail | null {
	if (!cell) return null;
	const payload = getCellPayload(cell);
	switch (getCellCase(cell)) {
		case 'sqlCell':
			return {
				kind: 'SQL query',
				fileName: 'query.sql',
				lang: 'sql',
				inputLabel: 'Query',
				code: asString(payload.query),
				outputLabel: 'Result',
				outputFormat: 'dataframe',
				output: asString(payload.dataframePreview)
			};
		case 'pyCell':
			return {
				kind: 'Python',
				fileName: 'transform.py',
				lang: 'python',
				inputLabel: 'Code',
				code: asString(payload.code),
				outputLabel: 'Output',
				outputFormat: 'text',
				output: [...asStrings(payload.output), ...asStrings(payload.dataframePreview)]
					.filter(Boolean)
					.join('\n')
			};
		default:
			return null;
	}
}

/** Lineage nodes backed by a cell whose code we can show. Connector, table and
 *  answer nodes are not clickable. */
export function inspectableCellIds(
	citation: Citation | null | undefined,
	cellsById: Map<string, CellLike>
): Set<string> {
	const ids = new Set<string>();
	for (const node of citation?.lineage ?? []) {
		if (cellCodeDetail(cellsById.get(node.cellId))) ids.add(node.cellId);
	}
	return ids;
}
