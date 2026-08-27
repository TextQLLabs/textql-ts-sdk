import { ChevronRight } from 'lucide-react';
import { memo, useState } from 'react';

import {
	asString,
	buildSegments,
	getActiveSummary,
	getBatchHeadline,
	getBatchStartedAtMs,
	getCellCase,
	getCellContent,
	getCellPayload,
	getCellStartedAtMs,
	getSegmentKey,
	getStepLabel,
	isCellExecuting,
	type CellLike,
	type Segment
} from '../lib/cells';
import { CELL_BODY, CELL_LABEL } from '../lib/cellText';
import { cx } from '../lib/cx';
import {
	cellOpensInPreviewPanel,
	previewItemsFromCell,
	previewPanel,
	usePreviewSelection
} from '../lib/previewPanel';
import { CellDetail } from './CellDetail';
import { HaltCell } from './HaltCell';
import { Collapse } from './Collapse';
import { Markdown } from './Markdown';
import { QuestionsCell } from './QuestionsCell';
import { RunningDuration } from './RunningDuration';
import { ThinkingCell } from './ThinkingCell';
import { UnicodeSpinner } from './UnicodeSpinner';

type Props = { cells: CellLike[]; streaming?: boolean; onAnswered?: () => void };

const CHEVRON = 'shrink-0 text-[#a1a1aa] transition-transform duration-150 motion-reduce:transition-none';
const STEP_HEADER =
	'group max-w-full cursor-pointer items-center gap-1 rounded-xs border-0 bg-transparent px-1.5 py-1 text-left';
const STEP_LABEL =
	cx(
		CELL_BODY,
		'min-w-0 overflow-hidden font-medium text-ellipsis whitespace-nowrap text-[#a1a1aa] group-hover:text-text-3'
	);

function assistantHtml(cell: CellLike): string {
	return asString(getCellPayload(cell).renderedHtml);
}

function batchLabel(cells: CellLike[], active: boolean): string {
	if (active) return getActiveSummary(cells);
	return getBatchHeadline(cells);
}

function stepKey(batchKey: string, cell: CellLike, idx: number): string {
	return `${batchKey}:${cell.id || idx}`;
}

function thoughtContent(cell: CellLike): string {
	if (getCellPayload(cell).redacted === true) return '_Thinking (redacted)_';
	return getCellContent(cell);
}

function openPreview(cell: CellLike) {
	const items = previewItemsFromCell(cell);
	if (items.length === 0) return;
	for (const item of items) previewPanel.openItem(item);
	previewPanel.select(items[0]!.id);
}

/**
 * Memoized: a chat's completed turns keep their cell arrays across a stream, so
 * only the turn currently being written re-renders per event.
 */
export const ToolSequence = memo(function ToolSequence({
	cells,
	streaming = false,
	onAnswered
}: Props) {
	const panel = usePreviewSelection();
	// ChatPage's upsertAssistantCell reassigns the cells array on every stream
	// snapshot, so array identity alone is enough to recompute the segments.
	const segments = buildSegments(cells);
	/** Batches stay collapsed until the user clicks. */
	const [expandedBatches, setExpandedBatches] = useState<Set<string>>(() => new Set());
	/** Nested step detail inside an open batch. */
	const [expandedSteps, setExpandedSteps] = useState<Set<string>>(() => new Set());

	function toggleIn(set: Set<string>, key: string): Set<string> {
		const next = new Set(set);
		if (next.has(key)) next.delete(key);
		else next.add(key);
		return next;
	}

	const toggleBatch = (key: string) => setExpandedBatches((current) => toggleIn(current, key));
	const toggleStep = (key: string) => setExpandedSteps((current) => toggleIn(current, key));

	/** A segment is live while it has incomplete cells, or is the trailing segment mid-stream. */
	function isSegmentActive(segment: Segment, index: number): boolean {
		if (!streaming) return false;
		if (index === segments.length - 1) return true;
		const segCells = segment.type === 'toolgroup' ? segment.cells : [segment.cell];
		return segCells.some((cell) => !cell.complete);
	}

	function onStepClick(cell: CellLike, sKey: string) {
		if (cellOpensInPreviewPanel(cell)) {
			openPreview(cell);
			return;
		}
		toggleStep(sKey);
	}

	function isAssetStepOpen(cell: CellLike): boolean {
		if (!panel.open) return false;
		const items = previewItemsFromCell(cell);
		return items.some((item) => item.id === panel.selectedId);
	}

	if (segments.length === 0) {
		return streaming ? (
			<UnicodeSpinner className="streaming-indicator" label="Waiting for response" />
		) : null;
	}

	return (
		<div className="flex flex-col gap-1.5">
			{segments.map((segment, segIdx) => {
				const key = getSegmentKey(segment, segIdx);
				const active = isSegmentActive(segment, segIdx);

				if (segment.type === 'assistant') {
					const live = active && !segment.cell.complete;
					return (
						<div className="py-0.5" key={key}>
							<Markdown
								renderedHtml={live ? '' : assistantHtml(segment.cell)}
								content={getCellContent(segment.cell)}
							/>
						</div>
					);
				}

				if (segment.type === 'questions') {
					return <QuestionsCell key={key} cell={segment.cell} onAnswered={onAnswered} />;
				}

				if (segment.type === 'halt') {
					return <HaltCell key={key} cell={segment.cell} onResolved={onAnswered} />;
				}

				const open = expandedBatches.has(key);
				const batchRunning = segment.cells.some((cell) => isCellExecuting(cell, active));
				const liveThoughts = active
					? segment.cells.filter(
						(cell) => getCellCase(cell) === 'thinkingCell' && isCellExecuting(cell, true)
					)
					: [];

				return (
					<div className="rounded-xs" key={key}>
						<button
							type="button"
							className="flex w-full cursor-pointer items-center gap-2 rounded-xs border-0 bg-ink/3.5 px-2 py-[5px] text-left hover:bg-ink/6"
							aria-expanded={open}
							onClick={() => toggleBatch(key)}
						>
							{/* .shimmer comes from app.css */}
							<span
								className={cx(
									CELL_BODY,
									'min-w-0 flex-1 overflow-hidden font-medium text-ellipsis whitespace-nowrap text-muted',
									batchRunning && 'shimmer'
								)}
							>
								{batchLabel(segment.cells, batchRunning)}
							</span>
							{batchRunning && (
								<span className="ml-1 inline-flex shrink-0 items-center gap-1.5">
									<UnicodeSpinner label="Running tools" />
									<RunningDuration startedAtMs={getBatchStartedAtMs(segment.cells)} />
								</span>
							)}
							<ChevronRight size={14} className={cx(CHEVRON, open && 'rotate-90')} />
						</button>

						{liveThoughts.length > 0 && !open && (
							<div className="pt-0.5 pr-0 pb-1 pl-2">
								{liveThoughts.map((thought, i) => (
									<ThinkingCell key={String(thought.id ?? i)} cell={thought} active />
								))}
							</div>
						)}

						<Collapse open={open} className="flex flex-col gap-0.5 pt-1 pr-0 pb-0.5 pl-2">
							{segment.cells.map((cell, cellIdx) => {
								const sKey = stepKey(key, cell, cellIdx);
								const stepOpen = expandedSteps.has(sKey);
								const isThought = getCellCase(cell) === 'thinkingCell';
								const isAsset = cellOpensInPreviewPanel(cell);
								const running = isCellExecuting(cell, active);

								return (
									<div key={cell.id || `${getCellCase(cell)}:${cellIdx}`}>
										{isThought && running ? (
											<ThinkingCell cell={cell} active />
										) : (
											<>
												<button
													type="button"
													className={cx(STEP_HEADER, isThought ? 'inline-flex' : 'flex w-full')}
													aria-expanded={isAsset ? isAssetStepOpen(cell) : stepOpen}
													onClick={() => onStepClick(cell, sKey)}
												>
													<span className={cx(STEP_LABEL, isThought ? 'flex-[0_1_auto]' : 'flex-1')}>
														{getStepLabel(cell, active)}
													</span>
													<span className="ml-auto inline-flex shrink-0 items-center gap-1.5">
														{running && <RunningDuration startedAtMs={getCellStartedAtMs(cell)} />}
														{isAsset && (
															<span className={cx(CELL_LABEL, 'text-[#a1a1aa] group-hover:text-text-3')}>
																Open
															</span>
														)}
														<ChevronRight
															size={12}
															className={cx(CHEVRON, !isAsset && stepOpen && 'rotate-90')}
														/>
													</span>
												</button>
												{!isAsset && (
													<Collapse open={stepOpen} className="pt-0.5 pr-1.5 pb-2 pl-1">
														{isThought ? (
															<div className="pl-0.5">
																<Markdown content={thoughtContent(cell)} muted />
															</div>
														) : (
															<CellDetail cell={cell} />
														)}
													</Collapse>
												)}
											</>
										)}
									</div>
								);
							})}
						</Collapse>
					</div>
				);
			})}
		</div>
	);
});
