import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import { Database, FileCode2, Plug, Table2 } from 'lucide-react';

import { CELL_BODY, CELL_LABEL, CELL_META } from '../../lib/cellText';
import { cx } from '../../lib/cx';
import type { IconComponent } from '../../lib/icon';
import type { LineageNodeKind } from '../../lib/lineageGraph';
import { stripMarkdown } from '../../lib/utils';

/** Everything a node draws, resolved by the map so N nodes share one lookup. */
export type LineageNodeData = {
	kind: LineageNodeKind;
	label: string;
	title: string;
	subtitle?: string;
	/** Brand logo of the connector behind a connector or SQL node. */
	logoUrl?: string;
	/** Backed by a cell whose code the modal can show. */
	inspectable: boolean;
	selected: boolean;
};

export type LineageFlowNode = Node<LineageNodeData, 'lineage'>;

// Answer nodes render no icon, so the map omits that kind.
const ICON: Record<Exclude<LineageNodeKind, 'answer'>, IconComponent> = {
	connector: Plug,
	table: Table2,
	sql: Database,
	python: FileCode2
};

/** React Flow's handles are invisible: the graph is read, not edited. */
const HANDLE_STYLE = { opacity: 0 } as const;

export function LineageNode({ data }: NodeProps<LineageFlowNode>) {
	const Icon = data.kind === 'answer' ? undefined : ICON[data.kind];
	const isAnswer = Icon === undefined;
	const title = isAnswer ? stripMarkdown(data.title) : data.title;

	return (
		<>
			<Handle type="target" position={Position.Top} isConnectable={false} style={HANDLE_STYLE} />
			<div
				className={cx(
					'relative rounded-sm border px-3 py-2 shadow-xs transition-all',
					data.inspectable
						? 'cursor-pointer bg-elevate hover:-translate-y-0.5 hover:shadow-md'
						: 'cursor-default bg-fill',
					data.selected
						? 'border-accent'
						: data.inspectable
							? 'border-accent/40 hover:border-accent/70'
							: 'border-line',
					isAnswer ? 'w-72' : 'w-44'
				)}
			>
				{data.inspectable && (
					<span
						className="absolute -top-2 right-2 inline-flex items-center rounded-xs bg-accent px-1.5 py-0.5 text-[9px] font-semibold text-white shadow-xs"
						title="Click to view code"
					>
						View code
					</span>
				)}
				<div className={cx(CELL_LABEL, 'text-[10px] text-muted')}>{data.label}</div>
				<div
					className={cx(
						CELL_BODY,
						'mt-0.5 flex gap-1.5 font-semibold text-ink',
						isAnswer ? 'items-start' : 'items-center'
					)}
				>
					{data.logoUrl ? (
						<img className="size-4 shrink-0 object-contain" src={data.logoUrl} alt="" />
					) : (
						Icon && <Icon size={16} className="shrink-0 text-muted" />
					)}
					<span
						className={isAnswer ? 'wrap-anywhere whitespace-normal' : 'truncate'}
						title={isAnswer ? undefined : title}
					>
						{title}
					</span>
				</div>
				{data.subtitle && (
					<div className={cx(CELL_META, 'mt-0.5 truncate text-muted')} title={data.subtitle}>
						{data.subtitle}
					</div>
				)}
			</div>
			<Handle
				type="source"
				position={Position.Bottom}
				isConnectable={false}
				style={HANDLE_STYLE}
			/>
		</>
	);
}
