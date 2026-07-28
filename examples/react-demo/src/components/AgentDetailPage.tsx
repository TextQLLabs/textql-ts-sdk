import {
	ArrowLeft,
	Ban,
	CircleCheck,
	CircleX,
	Clock,
	Copy,
	Eye,
	Pencil,
	Plus,
	Settings2,
	X,
	type LucideIcon
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { FThreadsIcon } from '../assets/icons/FThreadsIcon';
import { CHAT_MODELS, isKnownChatModel } from '../lib/chatModels';
import { connectorIconSrc } from '../lib/connectorIcons';
import { cronToSchedule, defaultSchedule, scheduleToCron, type CronSchedule } from '../lib/cronSchedule';
import { cx } from '../lib/cx';
import { promptViewPref, usePromptView } from '../lib/promptViewPref';
import { usePageTitle } from '../lib/usePageTitle';
import { isRecord } from '../lib/utils';
import { Page, Select, toast, type SelectOption } from '../primitives';
import { AgentIdenticon } from './AgentIdenticon';
import { AgentRunDetail } from './AgentRunDetail';
import { STATE_BLOCK, STATE_TEXT, STATE_TITLE } from './pageStyles';
import { Markdown } from './Markdown';
import { ScheduleEditor } from './ScheduleEditor';
import { UnicodeSpinner } from './UnicodeSpinner';

type AgentRun = {
	id: string;
	status: string;
	triggerSource: string | null;
	chatId: string | null;
	toolCallsCount: number;
	lastSummary: string | null;
	errorKind: string | null;
	errorMessage: string | null;
	createdAt: string | null;
	startedAt: string | null;
	finishedAt: string | null;
};

type AgentDetail = {
	id: string;
	name: string;
	prompt: string;
	isActive: boolean;
	profileImageUrl: string | null;
	ownerName: string | null;
	llmModel: string | null;
	webhookTriggerId: string | null;
	schedules: string[];
	lastPostAt: string | null;
	lastChatId: string | null;
	postCount: number;
	commentCount: number;
	voteCount: number;
};

// ─── run presentation helpers ────────────────────────────────────────────
type RunStatusKey = 'done' | 'running' | 'failed' | 'cancelled' | 'other';

function runStatusKey(status: string): RunStatusKey {
	const s = status.toUpperCase();
	if (s.includes('DONE') || s.includes('SUCCE') || s.includes('COMPLETE')) return 'done';
	if (s.includes('RUN') || s.includes('PROGRESS') || s.includes('PENDING') || s.includes('QUEUE'))
		return 'running';
	if (s.includes('FAIL') || s.includes('ERROR')) return 'failed';
	if (s.includes('CANCEL')) return 'cancelled';
	return 'other';
}

function runStatusLabel(status: string): string {
	switch (runStatusKey(status)) {
		case 'done':
			return 'Completed';
		case 'running':
			return 'Running';
		case 'failed':
			return 'Failed';
		case 'cancelled':
			return 'Cancelled';
		default:
			return status.replace(/^STATUS_/, '').replace(/_/g, ' ').toLowerCase() || 'Unknown';
	}
}

const FIELD = 'flex min-w-0 flex-col gap-1.5';
const FIELD_LABEL = 'text-[11.5px] font-medium text-muted';
const FIELD_HINT = 'text-[11px] leading-[1.4] text-muted';
const INPUT =
	'w-full rounded-sm border border-line/90 bg-paper px-2.5 py-2 text-[13px] text-ink focus:border-accent focus:outline-none';
const RAIL_ITEM =
	'flex w-full cursor-pointer items-center gap-[9px] rounded-sm p-2 text-ink no-underline transition-[background] duration-[120ms]';
const RAIL_ITEM_SELECTED = 'bg-accent/12';
const RAIL_ITEM_IDLE = 'hover:bg-elevate/70';
const RUN_BADGE = 'inline-flex items-center gap-[5px] rounded-full px-1.5 py-[3px] text-[11px] font-medium';
/* Write / Preview segmented toggle (shared choice via promptViewPref) */
// Colour lives on the active/idle branches, never on the base — two `text-*`
// utilities on one element are resolved by Tailwind's rule order, not ours.
const SEG_BTN =
	'inline-flex cursor-pointer items-center gap-[5px] rounded-xs border-0 px-2.5 py-[3px] text-[11.5px] font-medium transition-[background,color] duration-[120ms]';
const SEG_BTN_ACTIVE =
	'bg-elevate/92 text-ink shadow-[0_1px_2px_color-mix(in_srgb,var(--color-ink)_12%,transparent)]';
const SEG_BTN_IDLE = 'bg-transparent text-muted hover:text-ink';
const GHOST_BTN =
	'inline-flex cursor-pointer items-center gap-1.5 rounded-sm border-0 bg-transparent px-2.5 py-1.5 text-[12.5px] text-muted hover:bg-elevate/60 hover:text-ink';
const PRIMARY_BTN =
	'inline-flex cursor-pointer items-center gap-1.5 rounded-sm border-0 bg-accent px-3.5 py-1.5 text-[12.5px] text-white disabled:cursor-default disabled:opacity-50';
const LINK_BTN =
	'inline-flex cursor-pointer items-center gap-1.5 self-start rounded-sm border-0 bg-transparent px-2.5 py-1.5 text-[12.5px] text-accent hover:bg-elevate/60';

const RUN_TONE: Record<RunStatusKey, string> = {
	done: 'text-[#16794a] bg-[color-mix(in_srgb,#16794a_12%,transparent)]',
	running: 'text-[#1d5fb0] bg-[color-mix(in_srgb,#1d5fb0_12%,transparent)]',
	failed: 'text-[#b0341d] bg-[color-mix(in_srgb,#b0341d_12%,transparent)]',
	cancelled: 'text-muted bg-line/40',
	other: 'text-muted bg-line/40'
};

const RUN_ICONS: Record<RunStatusKey, LucideIcon> = {
	done: CircleCheck,
	running: Clock,
	failed: CircleX,
	cancelled: Ban,
	other: Clock
};

function runTimestamp(run: AgentRun): string | null {
	return run.finishedAt ?? run.startedAt ?? run.createdAt;
}

function formatWhen(value: string | null): string {
	if (!value) return '—';
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return '—';
	return date.toLocaleString(undefined, {
		month: 'short',
		day: 'numeric',
		hour: 'numeric',
		minute: '2-digit'
	});
}

function triggerLabel(source: string | null): string {
	if (!source) return 'Manual';
	return source.replace(/^TRIGGER_SOURCE_/, '').replace(/_/g, ' ').toLowerCase();
}

function parseRun(item: unknown): AgentRun | null {
	if (!isRecord(item) || typeof item.id !== 'string') return null;
	return {
		id: item.id,
		status: typeof item.status === 'string' ? item.status : 'STATUS_UNKNOWN',
		triggerSource: typeof item.triggerSource === 'string' ? item.triggerSource : null,
		chatId: typeof item.chatId === 'string' ? item.chatId : null,
		toolCallsCount: typeof item.toolCallsCount === 'number' ? item.toolCallsCount : 0,
		lastSummary: typeof item.lastSummary === 'string' ? item.lastSummary : null,
		errorKind: typeof item.errorKind === 'string' ? item.errorKind : null,
		errorMessage: typeof item.errorMessage === 'string' ? item.errorMessage : null,
		createdAt: typeof item.createdAt === 'string' ? item.createdAt : null,
		startedAt: typeof item.startedAt === 'string' ? item.startedAt : null,
		finishedAt: typeof item.finishedAt === 'string' ? item.finishedAt : null
	};
}

function parseDetail(item: unknown): AgentDetail | null {
	if (!isRecord(item) || typeof item.id !== 'string') return null;
	return {
		id: item.id,
		name: typeof item.name === 'string' ? item.name : 'Untitled agent',
		prompt: typeof item.prompt === 'string' ? item.prompt : '',
		isActive: item.isActive === true,
		profileImageUrl: typeof item.profileImageUrl === 'string' ? item.profileImageUrl : null,
		ownerName: typeof item.ownerName === 'string' ? item.ownerName : null,
		llmModel: typeof item.llmModel === 'string' ? item.llmModel : null,
		webhookTriggerId: typeof item.webhookTriggerId === 'string' ? item.webhookTriggerId : null,
		schedules: Array.isArray(item.schedules)
			? item.schedules.filter((cron): cron is string => typeof cron === 'string')
			: [],
		lastPostAt: typeof item.lastPostAt === 'string' ? item.lastPostAt : null,
		lastChatId: typeof item.lastChatId === 'string' ? item.lastChatId : null,
		postCount: typeof item.postCount === 'number' ? item.postCount : 0,
		commentCount: typeof item.commentCount === 'number' ? item.commentCount : 0,
		voteCount: typeof item.voteCount === 'number' ? item.voteCount : 0
	};
}

function apiErrorDetail(payload: unknown, fallback: string): string {
	if (isRecord(payload) && typeof payload.error === 'string') return payload.error;
	return fallback;
}

export function AgentDetailPage() {
	const params = useParams();
	const agentId = params.id;
	const runId = params.runId;
	const promptView = usePromptView();

	const [agent, setAgent] = useState<AgentDetail | undefined>();
	const [runs, setRuns] = useState<AgentRun[]>([]);
	const [resolvedId, setResolvedId] = useState<string | undefined>();
	const [loadError, setLoadError] = useState<string | undefined>();
	const loadRequest = useRef<AbortController | undefined>(undefined);

	// Editor draft — kept separate from `agent` so we can diff for the Save button.
	// Each trigger is a structured schedule (same picker as the playbooks editor).
	const [name, setName] = useState('');
	const [prompt, setPrompt] = useState('');
	const [isActive, setIsActive] = useState(true);
	const [llmModel, setLlmModel] = useState<string>('');
	const [triggers, setTriggers] = useState<CronSchedule[]>([]);

	const [saving, setSaving] = useState(false);
	const [actionError, setActionError] = useState<string | undefined>();
	const [saveNote, setSaveNote] = useState<string | undefined>();
	// Lifted from the run detail so the "Open thread" action can sit in the header.
	const [runChatId, setRunChatId] = useState<string | undefined>();

	usePageTitle(agent ? agent.name : 'Agent');

	const applyAgent = useCallback((detail: AgentDetail) => {
		setAgent(detail);
		setName(detail.name);
		setPrompt(detail.prompt);
		setIsActive(detail.isActive);
		setLlmModel(detail.llmModel ?? '');
		setTriggers(detail.schedules.map(cronToSchedule));
	}, []);

	const loadAgent = useCallback(
		async (id: string, force = false) => {
			if (!force && resolvedId === id && agent) return;

			loadRequest.current?.abort();
			const request = new AbortController();
			loadRequest.current = request;
			setLoadError(undefined);

			try {
				const response = await fetch(`/api/agents/${encodeURIComponent(id)}`, {
					signal: request.signal
				});
				const payload: unknown = await response.json();
				if (!response.ok) throw new Error(apiErrorDetail(payload, 'Unable to load agent.'));
				if (!isRecord(payload)) throw new Error('Unable to load agent.');

				const detail = parseDetail(payload.agent);
				if (!detail) throw new Error('Agent not found.');

				setRuns(
					Array.isArray(payload.runs)
						? payload.runs.map(parseRun).filter((run): run is AgentRun => run !== null)
						: []
				);
				applyAgent(detail);
				setResolvedId(id);
			} catch (error) {
				if (error instanceof DOMException && error.name === 'AbortError') return;
				setLoadError(error instanceof Error ? error.message : 'Unable to load agent.');
			}
		},
		[agent, applyAgent, resolvedId]
	);

	// Initial load + navigations between agents (SvelteKit's afterNavigate).
	useEffect(() => {
		setSaveNote(undefined);
		setActionError(undefined);
		if (agentId) void loadAgent(agentId);
		// eslint-disable-next-line react-hooks/exhaustive-deps -- refetch on id change only
	}, [agentId]);

	const draftSchedules = triggers
		.map((trigger) => scheduleToCron(trigger).trim())
		.filter(Boolean);

	const isDirty = agent
		? name.trim() !== agent.name ||
			prompt !== agent.prompt ||
			isActive !== agent.isActive ||
			llmModel !== (agent.llmModel ?? '') ||
			draftSchedules.join('\n') !== agent.schedules.join('\n')
		: false;

	const showLoading = (() => {
		if (!agentId) return false;
		if (loadError && resolvedId !== agentId) return false;
		if (resolvedId === agentId && agent) return false;
		return true;
	})();
	const showError = Boolean(agentId && loadError && resolvedId !== agentId && !showLoading);

	const selectedRun = runId ? runs.find((run) => run.id === runId) : undefined;

	// Include the agent's current model even if it isn't one of the presets, so
	// saving never silently downgrades it.
	const modelOptions: SelectOption<string>[] = (() => {
		const options: SelectOption<string>[] = CHAT_MODELS.map((model) => ({
			value: model.id,
			label: model.label,
			hint: model.hint,
			iconSrc: connectorIconSrc(model.provider)
		}));
		if (llmModel && !isKnownChatModel(llmModel)) {
			options.unshift({ value: llmModel, label: llmModel });
		}
		options.unshift({ value: '', label: 'Default' });
		return options;
	})();

	async function copyWebhookId() {
		const id = agent?.webhookTriggerId;
		if (!id) return;
		try {
			await navigator.clipboard.writeText(id);
			toast.success('Webhook ID copied');
		} catch {
			toast.error('Couldn’t copy to clipboard');
		}
	}

	function addTrigger() {
		setTriggers((current) => [...current, defaultSchedule()]);
	}

	function removeTrigger(index: number) {
		setTriggers((current) => current.filter((_, i) => i !== index));
	}

	async function saveAgent() {
		const current = agent;
		if (!current || saving || !isDirty) return;
		setSaving(true);
		setActionError(undefined);
		setSaveNote(undefined);
		try {
			const response = await fetch(`/api/agents/${encodeURIComponent(current.id)}`, {
				method: 'PUT',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({
					name: name.trim() || 'Untitled agent',
					prompt,
					isActive,
					llmModel: llmModel || undefined,
					schedules: draftSchedules
				})
			});
			const payload: unknown = await response.json();
			if (!response.ok) throw new Error(apiErrorDetail(payload, 'Unable to save agent.'));
			const detail = isRecord(payload) ? parseDetail(payload.agent) : null;
			if (!detail) throw new Error('Save returned no agent.');
			applyAgent(detail);
			setSaveNote('Saved');
			toast.success('Agent saved');
		} catch (error) {
			const detail = error instanceof Error ? error.message : 'Unable to save agent.';
			setActionError(detail);
			toast.error("Couldn't save agent", { description: detail });
		} finally {
			setSaving(false);
		}
	}

	if (showLoading) {
		return (
			<Page title="Agent" wide>
				<div className={STATE_BLOCK} aria-busy="true">
					<UnicodeSpinner label="Loading agent" />
					<p className={STATE_TEXT}>Loading agent…</p>
				</div>
			</Page>
		);
	}

	if (showError) {
		return (
			<Page title="Agent" wide>
				<div className={STATE_BLOCK}>
					<p className={STATE_TITLE}>Unable to load agent</p>
					<p className={STATE_TEXT}>{loadError}</p>
					<Link className={LINK_BTN} to="/agents">
						Back to agents
					</Link>
				</div>
			</Page>
		);
	}

	if (!agent) return null;

	const selectedRunKey = selectedRun ? runStatusKey(selectedRun.status) : undefined;
	const SelectedRunIcon = selectedRunKey ? RUN_ICONS[selectedRunKey] : undefined;

	return (
		// ─── Ontology-style: run history rail (LHS) + config/run viewer (RHS) ──
		<Page
			title=""
			wide
			actionsClassName="flex-1 justify-between"
			actions={
				<>
					<Link className={GHOST_BTN} to="/agents">
						<ArrowLeft size={15} />
						<span>All agents</span>
					</Link>
					{!runId ? (
						<div className="inline-flex items-center gap-2">
							{saveNote && !isDirty && <span className="text-[12px] text-[#16794a]">{saveNote}</span>}
							<button
								type="button"
								className={PRIMARY_BTN}
								disabled={saving || !isDirty || !name.trim()}
								onClick={saveAgent}
							>
								{saving ? 'Saving…' : 'Save'}
							</button>
						</div>
					) : runChatId ? (
						<Link className={PRIMARY_BTN} to={`/chat/${runChatId}`}>
							<FThreadsIcon className="text-[14px]" />
							<span>Open thread</span>
						</Link>
					) : null}
				</>
			}
		>
			<div className="grid min-h-0 flex-1 grid-cols-[minmax(220px,300px)_1fr] grid-rows-[minmax(0,1fr)] gap-4 max-[760px]:grid-cols-[minmax(0,1fr)] max-[760px]:grid-rows-[auto_minmax(0,1fr)]">
				{/* LHS: run history */}
				<aside className="flex min-h-0 flex-col overflow-hidden rounded-sm border border-line bg-ink/2.5">
					<header className="flex items-baseline justify-between border-b border-line px-3 py-[0.6rem] text-[12px] font-semibold text-muted">
						<span>History</span>
						<span className="font-mono text-[11px] font-medium">{runs.length}</span>
					</header>
					<div className="min-h-0 flex-1 overflow-y-auto p-[0.35rem]">
						<Link
							className={cx(RAIL_ITEM, !runId ? RAIL_ITEM_SELECTED : RAIL_ITEM_IDLE)}
							to={`/agents/${agent.id}`}
						>
							<Settings2 size={14} />
							<span className="text-[13px] font-medium">Configuration</span>
						</Link>

						<div className="px-2 pt-2.5 pb-1 text-[10.5px] font-semibold tracking-[0.06em] text-muted uppercase">Runs</div>

						{runs.length === 0 ? (
							<p className="m-0 p-2 text-[12px] text-muted">No runs yet</p>
						) : (
							runs.map((run) => {
								const key = runStatusKey(run.status);
								const RunIcon = RUN_ICONS[key];
								return (
									<Link
										key={run.id}
										className={cx(RAIL_ITEM, runId === run.id ? RAIL_ITEM_SELECTED : RAIL_ITEM_IDLE)}
										to={`/agents/${agent.id}/run/${run.id}`}
									>
										<span
											className={cx(RUN_BADGE, RUN_TONE[key])}
											title={runStatusLabel(run.status)}
										>
											<RunIcon size={13} />
										</span>
										<span className="flex min-w-0 flex-col gap-0.5">
											<span className="flex items-baseline justify-between gap-2">
												<span className="text-[12.5px] font-medium text-ink">{runStatusLabel(run.status)}</span>
												<span className="shrink-0 text-[10.5px] whitespace-nowrap text-muted">{formatWhen(runTimestamp(run))}</span>
											</span>
											<span className="overflow-hidden text-[11px] text-ellipsis whitespace-nowrap text-muted">
												{triggerLabel(run.triggerSource)}
												{run.toolCallsCount > 0 && ` · ${run.toolCallsCount} tools`}
											</span>
										</span>
									</Link>
								);
							})
						)}
					</div>
				</aside>

				{/* RHS: config or the selected run */}
				<section className="min-h-0 overflow-y-auto px-0.5 py-1">
					<div className="mb-5 flex flex-col items-start gap-2">
						<div className="flex min-w-0 items-center gap-2.5">
							<span className="inline-flex size-7 shrink-0 overflow-hidden rounded-sm" aria-hidden="true">
								{agent.profileImageUrl ? (
									<img className="size-full object-cover" src={agent.profileImageUrl} alt="" />
								) : (
									<AgentIdenticon
										name={agent.name}
										agentId={agent.id}
										isActive={agent.isActive}
										size={28}
									/>
								)}
							</span>
							<h1 className="m-0 text-[18px] leading-[1.2] font-[650] text-ink">{agent.name}</h1>
						</div>
						{agent.ownerName && <p className="m-0 text-[12.5px] text-muted">{agent.ownerName}</p>}
					</div>

					{runId ? (
						<div className="flex w-full flex-col gap-5">
							<div className="flex items-center gap-3">
								{selectedRun && SelectedRunIcon && selectedRunKey && (
									<span className={cx(RUN_BADGE, RUN_TONE[selectedRunKey])}>
										<SelectedRunIcon size={14} />
										{runStatusLabel(selectedRun.status)}
									</span>
								)}
								<span className="overflow-hidden font-mono text-[12px] text-ellipsis whitespace-nowrap text-muted" title={runId}>
									{runId}
								</span>
							</div>
							<AgentRunDetail
								agentId={agent.id}
								runId={runId}
								statusLabel={selectedRun ? triggerLabel(selectedRun.triggerSource) : undefined}
								onChatIdChange={setRunChatId}
							/>
						</div>
					) : (
						<>
							{actionError && (
								<p className="m-0 mb-3.5 rounded-sm bg-[color-mix(in_srgb,#b0341d_8%,transparent)] px-3 py-2 text-[12.5px] text-[#b0341d]" role="alert">
									{actionError}
								</p>
							)}
							<div className="flex w-full flex-col gap-4">
								<label className={FIELD}>
									<span className={FIELD_LABEL}>Model</span>
									<Select
										value={llmModel}
										options={modelOptions}
										onValueChange={setLlmModel}
										aria-label="Model"
									/>
								</label>

								<div className={FIELD}>
									<span className={FIELD_LABEL}>Webhook</span>
									{agent.webhookTriggerId ? (
										<>
											<p className={FIELD_HINT}>
												Trigger this agent from an external system using its webhook ID.
											</p>
											<div className="mt-1.5 flex items-center gap-2">
												<code className="min-w-0 flex-1 overflow-x-auto rounded-sm border border-line/90 bg-ink/2 px-2.5 py-2 font-mono text-[12px] whitespace-nowrap text-ink">{agent.webhookTriggerId}</code>
												<button type="button" className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-sm border border-line/90 bg-transparent px-2.5 py-2 text-[12.5px] text-muted transition-[background,color] duration-[120ms] hover:bg-ink/4 hover:text-ink" onClick={copyWebhookId}>
													<Copy size={14} />
													<span>Copy</span>
												</button>
											</div>
										</>
									) : (
										<p className={FIELD_HINT}>
											No webhook trigger is configured for this agent.
										</p>
									)}
								</div>

								<div className={FIELD}>
									<span className={FIELD_LABEL}>Triggers</span>
									{triggers.length === 0 && (
										<p className={FIELD_HINT}>
											No triggers — this agent only runs when triggered manually.
										</p>
									)}
									<div className="flex flex-col gap-2">
										{triggers.map((trigger, i) => (
											<div className="flex items-start gap-2 rounded-sm border border-line/90 bg-ink/2 p-2.5" key={i}>
												<div className="flex min-w-0 flex-1 flex-col gap-2">
													<ScheduleEditor
														value={trigger}
														onChange={(next) =>
															setTriggers((current) => current.map((t, j) => (j === i ? next : t)))
														}
													/>
												</div>
												<button
													type="button"
													className="inline-flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-sm border-0 bg-transparent text-muted transition-[background,color] duration-[120ms] hover:bg-ink/6 hover:text-ink"
													aria-label="Remove trigger"
													onClick={() => removeTrigger(i)}
												>
													<X size={14} />
												</button>
											</div>
										))}
									</div>
									<button type="button" className="mt-2 inline-flex cursor-pointer items-center gap-1.5 self-start rounded-sm border border-dashed border-line/90 bg-transparent px-2.5 py-1.5 text-[12.5px] text-muted transition-[background,color] duration-[120ms] hover:bg-ink/4 hover:text-ink" onClick={addTrigger}>
										<Plus size={14} />
										<span>Add trigger</span>
									</button>
								</div>

								<div className={FIELD}>
									<div className="flex items-center justify-between gap-2">
										<span className={FIELD_LABEL}>Prompt</span>
										<div className="inline-flex rounded-[8px] border border-line/85 bg-ink/3 p-0.5" role="tablist" aria-label="Prompt view">
											<button
												type="button"
												className={cx(SEG_BTN, promptView === 'write' ? SEG_BTN_ACTIVE : SEG_BTN_IDLE)}
												role="tab"
												aria-selected={promptView === 'write'}
												onClick={() => promptViewPref.setMode('write')}
											>
												<Pencil size={13} />
												<span>Write</span>
											</button>
											<button
												type="button"
												className={cx(SEG_BTN, promptView === 'preview' ? SEG_BTN_ACTIVE : SEG_BTN_IDLE)}
												role="tab"
												aria-selected={promptView === 'preview'}
												onClick={() => promptViewPref.setMode('preview')}
											>
												<Eye size={14} />
												<span>Preview</span>
											</button>
										</div>
									</div>
									{promptView === 'write' ? (
										<textarea
											className={cx(INPUT, 'resize-y leading-normal')}
											rows={10}
											value={prompt}
											onChange={(event) => setPrompt(event.target.value)}
											placeholder="What should this agent do?"
										/>
									) : (
										<div className={cx(INPUT, 'min-h-[200px] overflow-y-auto')}>
											{prompt.trim() ? (
												<Markdown content={prompt} />
											) : (
												<p className="m-0 text-[13px] text-muted italic">Nothing to preview yet.</p>
											)}
										</div>
									)}
								</div>
							</div>
						</>
					)}
				</section>
			</div>
		</Page>
	);
}
