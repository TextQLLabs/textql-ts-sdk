import { Activity } from 'lucide-react';

import { cx } from '../lib/cx';
import { formatDurationMs } from '../lib/runFormat';

export type RunStep = {
	tool: string;
	summary: string | null;
	error: string | null;
	cellId: string | null;
	durationMs: number;
	startedAtMs: number;
};

type Laid = RunStep & { startPct: number; widthPct: number };

// Lay steps out on a shared time axis. When the backend gives real start
// offsets we honor them; otherwise we stack sequentially by duration so the
// waterfall still reads left-to-right.
function layout(steps: RunStep[]): Laid[] {
	if (steps.length === 0) return [];
	const hasClock = steps.some((s) => s.startedAtMs > 0);

	if (hasClock) {
		const t0 = Math.min(...steps.map((s) => s.startedAtMs || 0));
		const t1 = Math.max(...steps.map((s) => (s.startedAtMs || 0) + s.durationMs));
		const span = Math.max(1, t1 - t0);
		return steps.map((s) => {
			const left = (((s.startedAtMs || 0) - t0) / span) * 100;
			const width = Math.max(1.5, (s.durationMs / span) * 100);
			return { ...s, startPct: left, widthPct: Math.min(width, 100 - left) };
		});
	}

	const total = Math.max(
		1,
		steps.reduce((sum, s) => sum + s.durationMs, 0)
	);
	let cursor = 0;
	return steps.map((s) => {
		const left = (cursor / total) * 100;
		const width = Math.max(1.5, (s.durationMs / total) * 100);
		cursor += s.durationMs;
		return { ...s, startPct: left, widthPct: Math.min(width, 100 - left) };
	});
}

export function RunTimeline({ steps = [] }: { steps?: RunStep[] }) {
	const laid = layout(steps);

	if (laid.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center gap-2 px-4 py-10 text-center">
				<span className="inline-flex size-12 items-center justify-center rounded-full bg-ink/5 text-muted">
					<Activity size={22} />
				</span>
				<p className="m-0 text-[13px] font-semibold text-ink">No steps recorded</p>
				<p className="m-0 text-[12.5px] text-muted">This run didn't record any tool calls.</p>
			</div>
		);
	}

	return (
		<ol className="m-0 flex list-none flex-col gap-2.5 p-0">
			{laid.map((step, i) => (
				<li
					className={cx(
						'flex flex-col gap-1.5 rounded-sm border bg-ink/2 px-3 py-2.5',
						step.error ? 'border-[color-mix(in_srgb,#b91c1c_35%,var(--color-line))]' : 'border-line/90'
					)}
					key={i}
				>
					<div className="flex items-center gap-2">
						<span className="inline-flex size-[18px] shrink-0 items-center justify-center rounded-full bg-ink/7 text-[10.5px] tabular-nums text-muted">
							{i + 1}
						</span>
						<span className="min-w-0 flex-1 overflow-hidden font-mono text-[12.5px] font-medium text-ellipsis whitespace-nowrap text-ink">
							{step.tool}
						</span>
						<span className="shrink-0 text-[11px] tabular-nums text-muted">
							{formatDurationMs(step.durationMs)}
						</span>
					</div>
					<div className="relative h-2 rounded-[3px] bg-ink/5">
						<span
							className={cx(
								'absolute top-0 h-full min-w-[3px] rounded-[3px]',
								step.error ? 'bg-[#f87171]' : 'bg-accent'
							)}
							style={{ left: `${step.startPct}%`, width: `${step.widthPct}%` }}
						/>
					</div>
					{step.summary && (
						<p className="m-0 text-xs leading-[1.45] text-muted">{step.summary}</p>
					)}
					{step.error && (
						<p className="m-0 font-mono text-[11.5px] leading-[1.45] whitespace-pre-wrap text-[#b91c1c]">
							{step.error}
						</p>
					)}
				</li>
			))}
		</ol>
	);
}
