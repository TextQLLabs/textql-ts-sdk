import { ChevronRight, Globe } from 'lucide-react';
import { useState } from 'react';

import { cx } from '../lib/cx';
import { formatBytes, formatDurationMs } from '../lib/runFormat';

export type EgressCall = {
	id: string;
	method: string;
	scheme: string;
	host: string;
	path: string;
	statusCode: number;
	outcome: string;
	durationMs: number;
	requestBytes: number;
	responseBytes: number;
	cellId: string | null;
	occurredAt: string | null;
};

type Severity = 'ok' | 'denied' | 'error';

function startMs(call: EgressCall): number {
	return call.occurredAt ? new Date(call.occurredAt).getTime() : 0;
}

function severity(call: EgressCall): Severity {
	if (call.outcome === 'denied') return 'denied';
	if (call.outcome !== 'ok' || call.statusCode >= 400) return 'error';
	return 'ok';
}

function statusText(call: EgressCall): string {
	if (call.outcome === 'denied') return 'denied';
	if (call.statusCode > 0) return String(call.statusCode);
	return call.outcome;
}

function formatClock(iso: string | null): string {
	if (!iso) return '—';
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return '—';
	const p = (n: number, len = 2) => String(n).padStart(len, '0');
	return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}.${p(d.getMilliseconds(), 3)}`;
}

const MIN_BAR_PCT = 1.5;

const BADGE_TONE: Record<Severity, string> = {
	ok: 'text-[#15803d] bg-[color-mix(in_srgb,#15803d_12%,transparent)]',
	denied: 'text-[#b45309] bg-[color-mix(in_srgb,#b45309_14%,transparent)]',
	error: 'text-[#b91c1c] bg-[color-mix(in_srgb,#b91c1c_12%,transparent)]'
};
const BAR_TONE: Record<Severity, string> = {
	ok: 'bg-[#4ade80]',
	denied: 'bg-[#fbbf24]',
	error: 'bg-[#f87171]'
};
const FOOT_TONE: Record<Severity, string> = {
	ok: 'text-[#15803d]',
	denied: 'text-[#b45309]',
	error: 'text-[#b91c1c]'
};

const ROW =
	'grid grid-cols-[18px_52px_minmax(0,1.4fr)_64px_96px_minmax(0,2fr)_64px] items-center gap-3 px-3 py-[7px] text-left';

type Props = {
	/** Calls must be oldest-first so the waterfall reads chronologically. */
	calls?: EgressCall[];
	emptyDescription?: string;
};

export function EgressTable({
	calls = [],
	emptyDescription = "This run hasn't made any outbound HTTP requests."
}: Props) {
	const [expanded, setExpanded] = useState<Record<string, boolean>>({});
	const toggle = (id: string) => setExpanded((current) => ({ ...current, [id]: !current[id] }));

	const t0 = calls.length ? Math.min(...calls.map(startMs)) : 0;
	const t1 = calls.length ? Math.max(...calls.map((c) => startMs(c) + c.durationMs)) : 0;
	const span = Math.max(1, t1 - t0);

	function barStyle(call: EgressCall) {
		const left = ((startMs(call) - t0) / span) * 100;
		let width = (call.durationMs / span) * 100;
		if (width < MIN_BAR_PCT) width = MIN_BAR_PCT;
		if (left + width > 100) width = Math.max(MIN_BAR_PCT, 100 - left);
		return { left: `${left}%`, width: `${width}%` };
	}

	const counts = calls.reduce<Record<string, number>>((acc, call) => {
		const sev = severity(call);
		acc[sev] = (acc[sev] ?? 0) + 1;
		return acc;
	}, {});

	if (calls.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center gap-2 px-4 py-10 text-center">
				<span className="inline-flex size-12 items-center justify-center rounded-full bg-ink/5 text-muted">
					<Globe size={22} />
				</span>
				<p className="m-0 text-[13px] font-semibold text-ink">No network calls recorded</p>
				<p className="m-0 max-w-[280px] text-[12.5px] leading-[1.45] text-muted">
					{emptyDescription}
				</p>
			</div>
		);
	}

	return (
		<div className="flex flex-col overflow-hidden rounded-sm border border-line">
			<div
				className={cx(
					ROW,
					'border-b border-line bg-ink/3 text-[10px] font-semibold tracking-[0.05em] text-muted uppercase'
				)}
			>
				<span />
				<span>Method</span>
				<span>Host</span>
				<span>Status</span>
				<span>Time</span>
				<span>Timeline</span>
				<span className="text-right">Duration</span>
			</div>

			<div className="flex flex-col">
				{calls.map((call) => {
					const open = expanded[call.id];
					const sev = severity(call);
					return (
						<div className="border-b border-line/60 last:border-b-0" key={call.id}>
							<button
								className={cx(ROW, 'w-full cursor-pointer border-0 bg-transparent text-[12px] hover:bg-ink/3')}
								onClick={() => toggle(call.id)}
								aria-expanded={open}
							>
								<ChevronRight
									size={13}
									className={cx(
										'text-muted transition-transform duration-[120ms]',
										open && 'rotate-90'
									)}
								/>
								<span className="font-mono text-[11px] text-muted">{call.method}</span>
								<span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
									<span className="text-ink">{call.host}</span>
									<span className="text-muted">{call.path}</span>
								</span>
								<span>
									<span
										className={cx(
											'rounded-[4px] px-1.5 py-px text-[11px] font-medium tabular-nums',
											BADGE_TONE[sev]
										)}
									>
										{statusText(call)}
									</span>
								</span>
								<span className="font-mono text-[11px] text-muted">
									{formatClock(call.occurredAt)}
								</span>
								<span className="relative block h-4">
									<span
										className={cx(
											'absolute top-1/2 h-1.5 -translate-y-1/2 rounded-[2px]',
											BAR_TONE[sev]
										)}
										style={barStyle(call)}
									/>
								</span>
								<span className="text-right font-mono text-[11px] tabular-nums text-ink">
									{formatDurationMs(call.durationMs)}
								</span>
							</button>
							{open && (
								<dl className="m-0 grid grid-cols-[84px_minmax(0,1fr)] gap-x-3 gap-y-1 bg-ink/2 pt-2 pr-3 pb-3 pl-[42px] text-[12px] [&_dd]:m-0 [&_dd]:text-ink [&_dt]:text-muted">
									<dt>URL</dt>
									<dd className="font-mono wrap-anywhere">
										{call.scheme}://{call.host}
										{call.path}
									</dd>
									<dt>Status</dt>
									<dd>
										{call.statusCode > 0 ? call.statusCode : '—'} · {call.outcome}
									</dd>
									<dt>Request</dt>
									<dd className="font-mono">{formatBytes(call.requestBytes)}</dd>
									<dt>Response</dt>
									<dd className="font-mono">{formatBytes(call.responseBytes)}</dd>
									{call.cellId && (
										<>
											<dt>Cell</dt>
											<dd className="font-mono wrap-anywhere">{call.cellId}</dd>
										</>
									)}
								</dl>
							)}
						</div>
					);
				})}
			</div>

			<div className="flex items-center gap-3 border-t border-line px-3 py-2 text-[11.5px] text-muted">
				<span className="font-mono">
					{calls.length} call{calls.length === 1 ? '' : 's'}
				</span>
				{counts.ok ? <span className={FOOT_TONE.ok}>{counts.ok} ok</span> : null}
				{counts.denied ? <span className={FOOT_TONE.denied}>{counts.denied} denied</span> : null}
				{counts.error ? <span className={FOOT_TONE.error}>{counts.error} error</span> : null}
			</div>
		</div>
	);
}
