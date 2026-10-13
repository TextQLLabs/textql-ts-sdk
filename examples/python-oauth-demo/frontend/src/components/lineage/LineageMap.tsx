import {
	Background,
	Controls,
	Position,
	ReactFlow,
	type DefaultEdgeOptions,
	type Edge,
	type FitViewOptions,
	type NodeMouseHandler
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { GitFork, Maximize2 } from 'lucide-react';
import { useCallback, useMemo, useRef } from 'react';

import { CELL_BODY, CELL_META } from '../../lib/cellText';
import type { CitationView } from '../../lib/citations';
import { connectorIconSrc } from '../../lib/connectorIcons';
import { useConnectorMap } from '../../lib/connectorsCache';
import { cx } from '../../lib/cx';
import { buildLineageGraph } from '../../lib/lineageGraph';
import { useResolvedTheme } from '../../lib/themePref';
import { LineageNode, type LineageFlowNode } from './LineageNode';

type Props = {
	citation: CitationView;
	/** Lineage cells whose code can be shown; the only clickable nodes. */
	inspectableIds: Set<string>;
	selectedCellId?: string | null;
	onNodeClick?: (cellId: string) => void;
	onExpand?: () => void;
	fitPadding?: FitViewOptions['padding'];
	/** Borderless, for a host that draws its own frame. */
	flush?: boolean;
};

/** Column → y: sources at the top, the answer at the bottom. */
const LEVEL_GAP = 110;
const SIBLING_GAP = 220;

const NODE_TYPES = { lineage: LineageNode };
const EDGE_OPTIONS: DefaultEdgeOptions = {
	animated: true,
	style: { stroke: '#cbd5e1', strokeWidth: 1.5, strokeDasharray: '8 5' }
};
/** A deeper bezier than React Flow's default, matching the product's graphs.
 *  Per edge: the default-options type has no slot for it. */
const EDGE_PATH = { curvature: 0.5 } as const;
const FLOW_STYLE = { background: 'transparent' } as const;
const PRO_OPTIONS = { hideAttribution: true } as const;

export function LineageMap({
	citation,
	inspectableIds,
	selectedCellId = null,
	onNodeClick,
	onExpand,
	fitPadding = 0.15,
	flush = false
}: Props) {
	const theme = useResolvedTheme();
	const connectors = useConnectorMap();
	const graph = useMemo(() => buildLineageGraph(citation), [citation]);

	const nodes = useMemo((): LineageFlowNode[] => {
		const byCol = new Map<number, typeof graph.nodes>();
		for (const node of graph.nodes) {
			const list = byCol.get(node.col) ?? [];
			list.push(node);
			byCol.set(node.col, list);
		}
		const out: LineageFlowNode[] = [];
		for (const [col, list] of byCol) {
			list.forEach((node, row) => {
				const connector =
					node.connectorId === undefined ? undefined : connectors.get(node.connectorId);
				out.push({
					id: node.id,
					type: 'lineage',
					position: { x: (row - (list.length - 1) / 2) * SIBLING_GAP, y: col * LEVEL_GAP },
					// Out the bottom, in the top: lines run from the connector down to the answer.
					sourcePosition: Position.Bottom,
					targetPosition: Position.Top,
					draggable: false,
					data: {
						kind: node.kind,
						label: node.label,
						// The builder only knows the id; the real name lands with the cache.
						title: node.kind === 'connector' && connector?.name ? connector.name : node.title,
						subtitle: node.subtitle,
						logoUrl: connector ? connectorIconSrc(connector.type) : undefined,
						inspectable: inspectableIds.has(node.id),
						selected: selectedCellId === node.id
					}
				});
			});
		}
		return out;
	}, [graph, connectors, inspectableIds, selectedCellId]);

	const edges = useMemo(
		(): Edge[] =>
			graph.nodes.flatMap((node) =>
				node.inputs.map((input) => ({
					id: `${input}->${node.id}`,
					source: input,
					target: node.id,
					type: 'default' as const,
					pathOptions: EDGE_PATH
				}))
			),
		[graph]
	);

	const fitViewOptions = useMemo(
		(): FitViewOptions => ({ padding: fitPadding, maxZoom: 0.95 }),
		[fitPadding]
	);

	// Read through a ref: a new handler identity would re-render every node.
	const click = useRef({ inspectableIds, onNodeClick });
	click.current = { inspectableIds, onNodeClick };
	const handleNodeClick = useCallback<NodeMouseHandler<LineageFlowNode>>((_, node) => {
		// Connector, table and answer nodes have no code; ignoring them keeps the
		// detail pane from clearing on a stray click.
		if (click.current.inspectableIds.has(node.id)) click.current.onNodeClick?.(node.id);
	}, []);

	return (
		<div
			className={cx(
				'flex h-full min-h-0 flex-col bg-fill/60',
				!flush && 'rounded-sm border border-line'
			)}
		>
			<div className="flex items-center justify-between gap-2 px-3 pt-3">
				<div className="flex items-center gap-2">
					<GitFork size={16} className="text-muted" />
					<span className={cx(CELL_BODY, 'font-semibold text-text-2')}>Data lineage</span>
				</div>
				{onExpand && (
					<button
						type="button"
						className={cx(
							CELL_META,
							'inline-flex cursor-pointer items-center gap-1.5 rounded-xs border border-line bg-elevate px-2.5 py-1 font-medium text-text-2 transition-colors hover:bg-fill'
						)}
						onClick={onExpand}
					>
						<Maximize2 size={14} />
						Expand
					</button>
				)}
			</div>

			<div className="relative mt-2 min-h-0 w-full flex-1">
				<ReactFlow
					// A new citation is a new graph; remounting re-runs fitView on it.
					key={citation.key}
					nodes={nodes}
					edges={edges}
					nodeTypes={NODE_TYPES}
					defaultEdgeOptions={EDGE_OPTIONS}
					colorMode={theme}
					style={FLOW_STYLE}
					nodesDraggable={false}
					nodesConnectable={false}
					elementsSelectable={false}
					proOptions={PRO_OPTIONS}
					fitView
					fitViewOptions={fitViewOptions}
					minZoom={0.2}
					maxZoom={1.5}
					onNodeClick={handleNodeClick}
				>
					<Background />
					<Controls showInteractive={false} position="bottom-right" />
				</ReactFlow>
			</div>

			{!graph.hasLineage && (
				<div className={cx(CELL_META, 'px-3 pb-3 text-muted italic')}>
					No upstream lineage recovered: this citation links directly to its source cell.
				</div>
			)}
		</div>
	);
}
