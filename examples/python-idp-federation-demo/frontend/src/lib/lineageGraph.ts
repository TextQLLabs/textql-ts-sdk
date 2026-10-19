import type { Citation } from './citations';

/**
 * The citation's lineage as a layered DAG: connector → tables → SQL result →
 * Python transforms → the answer. SQL nodes carry their connector and tables
 * inline, so those become synthetic nodes here for layout.
 */

export type LineageNodeKind = 'connector' | 'table' | 'sql' | 'python' | 'answer';

export type LineageGraphNode = {
	id: string;
	kind: LineageNodeKind;
	/** Layer: 0 = deepest source (top), max = answer (bottom). */
	col: number;
	label: string;
	title: string;
	subtitle?: string;
	/** SQL/connector nodes: resolves the brand logo. */
	connectorId?: number;
	inputs: string[];
};

export type LineageGraph = {
	nodes: LineageGraphNode[];
	hasLineage: boolean;
};

type UnlayeredNode = Omit<LineageGraphNode, 'col'>;

const ANSWER_NODE_ID = '__answer__';

export function buildLineageGraph(citation: Citation): LineageGraph {
	const lineage = citation.lineage;
	const known = new Set(lineage.map((node) => node.cellId));
	const nodes: UnlayeredNode[] = [];

	for (const node of lineage) {
		const cellInputs = node.inputCellIds.filter((id) => known.has(id));

		if (node.kind === 'sql') {
			let connectorId: string | undefined;
			if (node.connectorId !== undefined) {
				connectorId = `conn:${node.connectorId}`;
				if (!nodes.some((existing) => existing.id === connectorId)) {
					nodes.push({
						id: connectorId,
						kind: 'connector',
						label: 'Connector',
						// Placeholder; LineageNode resolves the real name from the cache.
						title: `Connector ${node.connectorId}`,
						connectorId: node.connectorId,
						inputs: []
					});
				}
			}

			const tableIds: string[] = [];
			for (const table of node.tables) {
				const id = `tbl:${node.cellId}:${table}`;
				nodes.push({
					id,
					kind: 'table',
					label: 'Table',
					title: table,
					inputs: connectorId ? [connectorId] : []
				});
				tableIds.push(id);
			}

			// Tables sit between the connector and the query when known; else the
			// query hangs off the connector, or off whatever cells fed it.
			const upstream = tableIds.length ? tableIds : connectorId ? [connectorId] : cellInputs;
			nodes.push({
				id: node.cellId,
				kind: 'sql',
				label: 'Query',
				title: node.dataframeName || 'SQL result',
				connectorId: node.connectorId,
				inputs: upstream
			});
		} else {
			nodes.push({
				id: node.cellId,
				kind: 'python',
				label: 'Transform',
				title: node.dataframeName || 'Python result',
				inputs: cellInputs
			});
		}
	}

	const answerInputs =
		citation.sourceCellId && nodes.some((node) => node.id === citation.sourceCellId)
			? [citation.sourceCellId]
			: [];
	nodes.push({
		id: ANSWER_NODE_ID,
		kind: 'answer',
		label: 'Answer',
		title: citation.anchor || 'Answer',
		subtitle: citation.claim || undefined,
		inputs: answerInputs
	});

	return { nodes: layer(nodes), hasLineage: lineage.length > 0 };
}

/** Longest-path layering: col(node) = 1 + max(col(inputs)), roots at 0. */
function layer(nodes: UnlayeredNode[]): LineageGraphNode[] {
	const byId = new Map(nodes.map((node) => [node.id, node]));
	const memo = new Map<string, number>();
	const onStack = new Set<string>();

	const depth = (id: string): number => {
		const cached = memo.get(id);
		if (cached !== undefined) return cached;
		const node = byId.get(id);
		if (!node || node.inputs.length === 0) {
			memo.set(id, 0);
			return 0;
		}
		if (onStack.has(id)) return 0;
		onStack.add(id);
		const result = 1 + Math.max(...node.inputs.map(depth));
		onStack.delete(id);
		memo.set(id, result);
		return result;
	};

	return nodes.map((node) => ({ ...node, col: depth(node.id) }));
}
