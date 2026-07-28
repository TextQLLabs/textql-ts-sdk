import { useEffect, useState } from 'react';

import { cx } from '../lib/cx';
import { formatDurationMs } from '../lib/runFormat';
import { isRecord } from '../lib/utils';
import { EgressTable, type EgressCall } from './EgressTable';
import { Markdown } from './Markdown';
import { RunTimeline, type RunStep } from './RunTimeline';
import { UnicodeSpinner } from './UnicodeSpinner';

type RunTrigger = {
	ip: string | null;
	userAgent: string | null;
	city: string | null;
	region: string | null;
	country: string | null;
	countryCode: string | null;
};

type RunDetail = {
	id: string;
	status: string;
	chatId: string | null;
	toolCallsCount: number;
	lastSummary: string | null;
	errorKind: string | null;
	errorMessage: string | null;
	startedAt: string | null;
	finishedAt: string | null;
	steps: RunStep[];
	egress: EgressCall[];
	trigger: RunTrigger | null;
};

type Props = {
	agentId: string;
	runId: string;
	statusLabel?: string;
	/** Lifted to the parent so the "Open thread" action can live in the header. */
	onChatIdChange?: (chatId: string | undefined) => void;
};

const STATE = 'flex flex-col items-center justify-center gap-2.5 px-4 py-12 text-center';
const STATE_TEXT = 'm-0 text-[13px] text-muted';
const TAB =
	'-mb-px inline-flex cursor-pointer items-center gap-1.5 border-0 border-b-2 bg-transparent px-0.5 py-2 text-[13px] transition-colors duration-[120ms] hover:text-ink';

function parseDetail(value: unknown): RunDetail | null {
	if (!isRecord(value) || typeof value.id !== 'string') return null;
	const steps = Array.isArray(value.steps) ? (value.steps.filter(isRecord) as unknown as RunStep[]) : [];
	const egress = Array.isArray(value.egress)
		? (value.egress.filter(isRecord) as unknown as EgressCall[])
		: [];
	return {
		id: value.id,
		status: typeof value.status === 'string' ? value.status : 'STATUS_UNKNOWN',
		chatId: typeof value.chatId === 'string' ? value.chatId : null,
		toolCallsCount: typeof value.toolCallsCount === 'number' ? value.toolCallsCount : 0,
		lastSummary: typeof value.lastSummary === 'string' ? value.lastSummary : null,
		errorKind: typeof value.errorKind === 'string' ? value.errorKind : null,
		errorMessage: typeof value.errorMessage === 'string' ? value.errorMessage : null,
		startedAt: typeof value.startedAt === 'string' ? value.startedAt : null,
		finishedAt: typeof value.finishedAt === 'string' ? value.finishedAt : null,
		steps,
		egress,
		trigger: (value.trigger as RunTrigger | null) ?? null
	};
}

export function AgentRunDetail({ agentId, runId, statusLabel, onChatIdChange }: Props) {
	const [detail, setDetail] = useState<RunDetail | undefined>();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | undefined>();
	const [tab, setTab] = useState<'timeline' | 'network'>('timeline');

	useEffect(() => {
		if (!runId || !agentId) return;

		const controller = new AbortController();
		setLoading(true);
		setError(undefined);
		onChatIdChange?.(undefined);

		fetch(`/api/agents/${encodeURIComponent(agentId)}/run/${encodeURIComponent(runId)}`, {
			signal: controller.signal
		})
			.then(async (response) => {
				const payload: unknown = await response.json();
				if (!response.ok || !isRecord(payload)) {
					throw new Error(
						isRecord(payload) && typeof payload.error === 'string'
							? payload.error
							: 'Unable to load run.'
					);
				}
				const parsed = parseDetail(payload.run);
				if (!parsed) throw new Error('Run not found.');
				setDetail(parsed);
				onChatIdChange?.(parsed.chatId ?? undefined);
			})
			.catch((err: unknown) => {
				if (err instanceof DOMException && err.name === 'AbortError') return;
				setError(err instanceof Error ? err.message : 'Unable to load run.');
			})
			.finally(() => setLoading(false));

		return () => controller.abort();
		// eslint-disable-next-line react-hooks/exhaustive-deps -- onChatIdChange is a stable callback from the parent
	}, [agentId, runId]);

	const durationText = (() => {
		if (!detail?.startedAt || !detail?.finishedAt) return '—';
		const ms = new Date(detail.finishedAt).getTime() - new Date(detail.startedAt).getTime();
		return ms >= 0 ? formatDurationMs(ms) : '—';
	})();

	const geoLabel = (() => {
		const t = detail?.trigger;
		if (!t) return null;
		const parts = [t.city, t.region, t.country ?? t.countryCode].filter(Boolean);
		return parts.length ? parts.join(', ') : null;
	})();

	const metaRows = (() => {
		const t = detail?.trigger;
		if (!t) return [] as { label: string; value: string }[];
		const rows: { label: string; value: string }[] = [];
		if (t.ip) rows.push({ label: 'Origin IP', value: t.ip });
		if (geoLabel) rows.push({ label: 'Location', value: geoLabel });
		if (t.userAgent) rows.push({ label: 'User agent', value: t.userAgent });
		return rows;
	})();

	if (loading && !detail) {
		return (
			<div className={STATE}>
				<UnicodeSpinner label="Loading run" />
				<p className={STATE_TEXT}>Loading run…</p>
			</div>
		);
	}

	if (error && !detail) {
		return (
			<div className={STATE}>
				<p className="m-0 text-[15px] font-medium text-ink">Unable to load run</p>
				<p className={STATE_TEXT}>{error}</p>
			</div>
		);
	}

	if (!detail) return null;

	return (
		<div className="flex w-full flex-col gap-4">
			{detail.lastSummary && (
				<div className="text-[13px] leading-[1.55]">
					<Markdown content={detail.lastSummary} />
				</div>
			)}

			<div className="flex flex-wrap items-center gap-2.5 text-[12px] text-muted [&_strong]:font-semibold [&_strong]:text-ink">
				<span>
					duration <strong>{durationText}</strong>
				</span>
				<span className="h-3 w-px bg-line" />
				<span>
					steps <strong>{detail.steps.length || detail.toolCallsCount}</strong>
				</span>
				{detail.egress.length > 0 && (
					<>
						<span className="h-3 w-px bg-line" />
						<span>
							network calls <strong>{detail.egress.length}</strong>
						</span>
					</>
				)}
				{statusLabel && (
					<>
						<span className="h-3 w-px bg-line" />
						<span>{statusLabel}</span>
					</>
				)}
			</div>

			{metaRows.length > 0 && (
				<dl className="m-0 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 rounded-sm border border-line bg-ink/2 px-3 py-2.5 text-[12px] [&_dd]:m-0 [&_dd]:font-mono [&_dd]:text-ink [&_dd]:wrap-anywhere [&_dt]:font-medium [&_dt]:text-muted">
					{metaRows.map((row) => (
						<div key={row.label} className="contents">
							<dt>{row.label}</dt>
							<dd>{row.value}</dd>
						</div>
					))}
				</dl>
			)}

			{(detail.errorMessage || detail.errorKind) && (
				<div className="rounded-sm border border-[color-mix(in_srgb,#b91c1c_30%,transparent)] bg-[color-mix(in_srgb,#b91c1c_6%,transparent)] px-3 py-2.5">
					{detail.errorKind && (
						<p className="m-0 mb-1 text-[12px] font-semibold text-[#b91c1c]">{detail.errorKind}</p>
					)}
					{detail.errorMessage && (
						<p className="m-0 font-mono text-xs leading-normal whitespace-pre-wrap text-ink">
							{detail.errorMessage}
						</p>
					)}
				</div>
			)}

			<div className="flex gap-[18px] border-b border-line" role="tablist">
				<button
					type="button"
					className={cx(
						TAB,
						tab === 'timeline'
							? 'border-b-ink font-medium text-ink'
							: 'border-b-transparent text-muted'
					)}
					role="tab"
					aria-selected={tab === 'timeline'}
					onClick={() => setTab('timeline')}
				>
					Timeline
				</button>
				<button
					type="button"
					className={cx(
						TAB,
						tab === 'network'
							? 'border-b-ink font-medium text-ink'
							: 'border-b-transparent text-muted'
					)}
					role="tab"
					aria-selected={tab === 'network'}
					onClick={() => setTab('network')}
				>
					Network
					{detail.egress.length > 0 && (
						<span className="rounded-full bg-ink/8 px-[5px] text-[10.5px] tabular-nums">
							{detail.egress.length}
						</span>
					)}
				</button>
			</div>

			<div>
				{tab === 'timeline' ? (
					<RunTimeline steps={detail.steps} />
				) : (
					<EgressTable calls={detail.egress} />
				)}
			</div>
		</div>
	);
}
