import { ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';

import { formatElapsed, type CellLike } from '../lib/cells';
import { CELL_BODY, CELL_META } from '../lib/cellText';
import { cx } from '../lib/cx';
import {
	buildTimeline,
	STEP_KIND_COLOR,
	STEP_KIND_LABEL,
	type StepKind,
	type TimelineStep,
	type TimelineTurn
} from '../lib/timeline';

const KINDS: StepKind[] = ['llm', 'query', 'tool'];

/** Sub-second reads better in ms; past that it matches the cell timers. */
function duration(ms: number): string {
	if (ms <= 0) return '';
	return ms < 1000 ? `${Math.round(ms)} ms` : formatElapsed(ms);
}

function turnSummary(turn: TimelineTurn): string {
	const parts: string[] = [];
	const queries = turn.steps.filter((step) => step.kind === 'query').length;
	const tools = turn.steps.filter((step) => step.kind === 'tool').length;
	if (queries > 0) parts.push(`${queries} quer${queries === 1 ? 'y' : 'ies'}`);
	if (tools > 0) parts.push(`${tools} tool${tools === 1 ? '' : 's'}`);
	if (turn.byKind.llm > 0) parts.push(`LLM ${duration(turn.byKind.llm)}`);
	return parts.join(' · ');
}

/** Bar for one step, positioned within the run's total active time. */
function StepBar({ step, totalMs }: { step: TimelineStep; totalMs: number }) {
	if (totalMs <= 0) return null;
	const left = (step.startMs / totalMs) * 100;
	// A floor so a fast step is still visible next to a slow one.
	const width = Math.max((step.durationMs / totalMs) * 100, 0.75);
	return (
		<span className="relative block h-1.5 flex-1 overflow-hidden rounded-full bg-ink/6">
			<span
				className="absolute top-0 h-full rounded-full"
				style={{
					left: `${left}%`,
					width: `${Math.min(width, 100 - left)}%`,
					background: step.failed ? 'var(--color-danger)' : STEP_KIND_COLOR[step.kind]
				}}
			/>
		</span>
	);
}

/**
 * The chat's run: how long it took, where the time went, and every step in
 * order. Ported from the product's thread insights Timeline tab — bars are laid
 * end-to-end by measured duration, so the window is active work, not wall clock
 * (idle time between messages would otherwise dwarf everything else).
 */
export function TimelinePanel({ cells }: { cells: CellLike[] }) {
	const timeline = useMemo(() => buildTimeline(cells), [cells]);
	const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());

	function toggle(id: string) {
		setCollapsed((current) => {
			const next = new Set(current);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	}

	if (timeline.turns.length === 0) {
		return (
			<p className={cx(CELL_BODY, 'm-0 text-muted')}>
				No steps yet — the timeline is built from the chat's cells.
			</p>
		);
	}

	const active = KINDS.filter((kind) => timeline.byKind[kind] > 0);

	return (
		<div className="flex flex-col gap-3">
			<section className="flex flex-col gap-2 rounded-sm border border-line bg-elevate px-3 py-2.5">
				<div className="flex items-baseline justify-between gap-2">
					<span className="flex items-baseline gap-1.5">
						<span className="text-[17px] font-semibold text-ink tabular-nums">
							{duration(timeline.totalMs) || '—'}
						</span>
						<span className={cx(CELL_META, 'text-muted')}>total</span>
					</span>
					<span className={cx(CELL_META, 'text-muted tabular-nums')}>
						{timeline.turns.length} turn{timeline.turns.length === 1 ? '' : 's'} ·{' '}
						{timeline.stepCount} step{timeline.stepCount === 1 ? '' : 's'}
					</span>
				</div>

				{timeline.totalMs > 0 && (
					<>
						<div className="flex h-1.5 overflow-hidden rounded-full bg-ink/8">
							{active.map((kind) => (
								<span
									key={kind}
									style={{ flex: timeline.byKind[kind], background: STEP_KIND_COLOR[kind] }}
								/>
							))}
						</div>
						<div className={cx(CELL_META, 'flex flex-wrap items-center gap-3 text-muted tabular-nums')}>
							{active.map((kind) => (
								<span className="inline-flex items-center gap-1.5" key={kind}>
									<span
										className="size-1.5 rounded-full"
										style={{ background: STEP_KIND_COLOR[kind] }}
									/>
									{STEP_KIND_LABEL[kind]} {duration(timeline.byKind[kind])}
								</span>
							))}
						</div>
					</>
				)}
			</section>

			{timeline.turns.map((turn) => {
				const open = !collapsed.has(turn.id);
				const summary = turnSummary(turn);

				return (
					<section className="flex flex-col" key={turn.id}>
						<button
							type="button"
							className="flex w-full cursor-pointer items-start gap-1.5 rounded-xs border-0 bg-transparent px-1 py-1 text-left hover:bg-ink/4"
							aria-expanded={open}
							onClick={() => toggle(turn.id)}
						>
							<span className="flex min-w-0 flex-1 flex-col gap-0.5">
								<span className={cx(CELL_BODY, 'line-clamp-2 font-medium text-ink')}>
									{turn.question || '(no user message)'}
								</span>
								<span className={cx(CELL_META, 'flex items-center gap-1.5 text-muted')}>
									{summary && <span>{summary}</span>}
									{turn.durationMs > 0 && (
										<>
											{summary && <span aria-hidden="true">·</span>}
											<span className="tabular-nums">{duration(turn.durationMs)}</span>
										</>
									)}
									{turn.failed && <span className="text-danger">error</span>}
								</span>
							</span>
							{turn.steps.length > 0 && (
								<ChevronRight
									size={13}
									className={cx(
										'mt-1 shrink-0 text-muted transition-transform duration-150 motion-reduce:transition-none',
										open && 'rotate-90'
									)}
								/>
							)}
						</button>

						{open && turn.steps.length > 0 && (
							<ul className="m-0 flex list-none flex-col gap-1 border-l border-line py-1 pr-1 pl-2.5">
								{turn.steps.map((step) => {
									const Icon = step.icon;
									return (
										<li className="flex flex-col gap-1" key={step.id}>
											<span className="flex items-center gap-1.5">
												<Icon size={12} className="shrink-0 text-muted" />
												<span
													className={cx(CELL_META, 'min-w-0 flex-1 truncate text-text-3')}
													title={step.detail || step.label}
												>
													{step.label}
													{step.detail && <span className="text-muted"> — {step.detail}</span>}
												</span>
												<span className={cx(CELL_META, 'shrink-0 text-muted tabular-nums')}>
													{duration(step.durationMs)}
												</span>
											</span>
											<StepBar step={step} totalMs={timeline.totalMs} />
										</li>
									);
								})}
							</ul>
						)}
					</section>
				);
			})}
		</div>
	);
}
