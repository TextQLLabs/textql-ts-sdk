<script lang="ts">
	import ArrowLeft from "@lucide/svelte/icons/arrow-left";
	import CircleCheck from "@lucide/svelte/icons/circle-check";
	import CircleX from "@lucide/svelte/icons/circle-x";
	import Clock from "@lucide/svelte/icons/clock";
	import Copy from "@lucide/svelte/icons/copy";
	import Ban from "@lucide/svelte/icons/ban";
	import Eye from "@lucide/svelte/icons/eye";
	import Pencil from "@lucide/svelte/icons/pencil";
	import Plus from "@lucide/svelte/icons/plus";
	import Settings from "@lucide/svelte/icons/settings-2";
	import X from "@lucide/svelte/icons/x";
	import { afterNavigate, goto } from "$app/navigation";
	import { resolve } from "$app/paths";
	import { page } from "$app/state";
	import { CHAT_MODELS, isKnownChatModel } from "$lib/chatModels";
	import { connectorIconSrc } from "$lib/connectorIcons";
	import FThreadsIcon from "$lib/assets/icons/FThreadsIcon.svelte";
	import AgentIdenticon from "$lib/components/AgentIdenticon.svelte";
	import AgentRunDetail from "$lib/components/AgentRunDetail.svelte";
	import Markdown from "$lib/components/Markdown.svelte";
	import ScheduleEditor from "$lib/components/ScheduleEditor.svelte";
	import UnicodeSpinner from "$lib/components/UnicodeSpinner.svelte";
	import {
		cronToSchedule,
		defaultSchedule,
		scheduleToCron,
		type CronSchedule,
	} from "$lib/cronSchedule";
	import { Page, Select, type SelectOption, toast } from "$lib/primitives";
	import { promptViewPref } from "$lib/promptViewPref.svelte";
	import { isRecord } from "$lib/utils";

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

	let agent = $state.raw<AgentDetail | undefined>();
	let runs = $state.raw<AgentRun[]>([]);
	let resolvedId = $state<string | undefined>();
	let loadError = $state<string | undefined>();
	let loadRequest: AbortController | undefined;

	// Editor draft — kept separate from `agent` so we can diff for the Save button.
	// Each trigger is a structured schedule (same picker as the playbooks editor).
	let name = $state("");
	let prompt = $state("");
	let isActive = $state(true);
	let llmModel = $state<string>("");
	let triggers = $state<CronSchedule[]>([]);

	function addTrigger() {
		triggers = [...triggers, defaultSchedule()];
	}

	function removeTrigger(index: number) {
		triggers = triggers.filter((_, i) => i !== index);
	}

	let saving = $state(false);
	let actionError = $state<string | undefined>();
	let saveNote = $state<string | undefined>();
	// Lifted from the run detail so the "Open thread" action can sit in the header.
	let runChatId = $state<string | undefined>();

	const agentId = $derived(
		typeof page.params.id === "string" ? page.params.id : undefined,
	);
	const runId = $derived(
		typeof page.params.runId === "string" ? page.params.runId : undefined,
	);
	const selectedRun = $derived(
		runId ? runs.find((run) => run.id === runId) : undefined,
	);

	const showLoading = $derived.by(() => {
		if (!agentId) return false;
		if (loadError && resolvedId !== agentId) return false;
		if (resolvedId === agentId && agent) return false;
		return true;
	});
	const showError = $derived(
		Boolean(agentId && loadError && resolvedId !== agentId && !showLoading),
	);

	const draftSchedules = $derived(
		triggers.map((trigger) => scheduleToCron(trigger).trim()).filter(Boolean),
	);
	const isDirty = $derived.by(() => {
		if (!agent) return false;
		return (
			name.trim() !== agent.name ||
			prompt !== agent.prompt ||
			isActive !== agent.isActive ||
			llmModel !== (agent.llmModel ?? "") ||
			draftSchedules.join("\n") !== agent.schedules.join("\n")
		);
	});

	// Include the agent's current model even if it isn't one of the presets, so
	// saving never silently downgrades it.
	const modelOptions = $derived.by((): SelectOption<string>[] => {
		const options: SelectOption<string>[] = CHAT_MODELS.map((model) => ({
			value: model.id,
			label: model.label,
			hint: model.hint,
			iconSrc: connectorIconSrc(model.provider),
		}));
		if (llmModel && !isKnownChatModel(llmModel)) {
			options.unshift({ value: llmModel, label: llmModel });
		}
		options.unshift({ value: "", label: "Default" });
		return options;
	});

	async function copyWebhookId() {
		const id = agent?.webhookTriggerId;
		if (!id) return;
		try {
			await navigator.clipboard.writeText(id);
			toast.success("Webhook ID copied");
		} catch {
			toast.error("Couldn’t copy to clipboard");
		}
	}

	function applyAgent(detail: AgentDetail) {
		agent = detail;
		name = detail.name;
		prompt = detail.prompt;
		isActive = detail.isActive;
		llmModel = detail.llmModel ?? "";
		triggers = detail.schedules.map(cronToSchedule);
	}

	function parseRun(item: unknown): AgentRun | null {
		if (!isRecord(item) || typeof item.id !== "string") return null;
		return {
			id: item.id,
			status: typeof item.status === "string" ? item.status : "STATUS_UNKNOWN",
			triggerSource:
				typeof item.triggerSource === "string" ? item.triggerSource : null,
			chatId: typeof item.chatId === "string" ? item.chatId : null,
			toolCallsCount:
				typeof item.toolCallsCount === "number" ? item.toolCallsCount : 0,
			lastSummary:
				typeof item.lastSummary === "string" ? item.lastSummary : null,
			errorKind: typeof item.errorKind === "string" ? item.errorKind : null,
			errorMessage:
				typeof item.errorMessage === "string" ? item.errorMessage : null,
			createdAt: typeof item.createdAt === "string" ? item.createdAt : null,
			startedAt: typeof item.startedAt === "string" ? item.startedAt : null,
			finishedAt:
				typeof item.finishedAt === "string" ? item.finishedAt : null,
		};
	}

	function parseDetail(item: unknown): AgentDetail | null {
		if (!isRecord(item) || typeof item.id !== "string") return null;
		return {
			id: item.id,
			name: typeof item.name === "string" ? item.name : "Untitled agent",
			prompt: typeof item.prompt === "string" ? item.prompt : "",
			isActive: item.isActive === true,
			profileImageUrl:
				typeof item.profileImageUrl === "string"
					? item.profileImageUrl
					: null,
			ownerName: typeof item.ownerName === "string" ? item.ownerName : null,
			llmModel: typeof item.llmModel === "string" ? item.llmModel : null,
			webhookTriggerId:
				typeof item.webhookTriggerId === "string"
					? item.webhookTriggerId
					: null,
			schedules: Array.isArray(item.schedules)
				? item.schedules.filter(
						(cron): cron is string => typeof cron === "string",
					)
				: [],
			lastPostAt:
				typeof item.lastPostAt === "string" ? item.lastPostAt : null,
			lastChatId:
				typeof item.lastChatId === "string" ? item.lastChatId : null,
			postCount: typeof item.postCount === "number" ? item.postCount : 0,
			commentCount:
				typeof item.commentCount === "number" ? item.commentCount : 0,
			voteCount: typeof item.voteCount === "number" ? item.voteCount : 0,
		};
	}

	function apiErrorDetail(payload: unknown, fallback: string): string {
		if (isRecord(payload) && typeof payload.error === "string") {
			return payload.error;
		}
		return fallback;
	}

	async function loadAgent(id: string, force = false) {
		if (!force && resolvedId === id && agent) return;

		loadRequest?.abort();
		const request = new AbortController();
		loadRequest = request;
		loadError = undefined;

		try {
			const response = await fetch(`/api/agents/${encodeURIComponent(id)}`, {
				signal: request.signal,
			});
			const payload: unknown = await response.json();
			if (!response.ok) {
				throw new Error(apiErrorDetail(payload, "Unable to load agent."));
			}
			if (!isRecord(payload)) throw new Error("Unable to load agent.");

			const detail = parseDetail(payload.agent);
			if (!detail) throw new Error("Agent not found.");

			runs = Array.isArray(payload.runs)
				? payload.runs
						.map(parseRun)
						.filter((run): run is AgentRun => run !== null)
				: [];
			applyAgent(detail);
			resolvedId = id;
		} catch (error) {
			if (error instanceof DOMException && error.name === "AbortError") return;
			loadError =
				error instanceof Error ? error.message : "Unable to load agent.";
		}
	}

	function syncFromRoute() {
		saveNote = undefined;
		actionError = undefined;
		if (agentId) void loadAgent(agentId);
	}

	async function saveAgent() {
		const current = agent;
		if (!current || saving || !isDirty) return;
		saving = true;
		actionError = undefined;
		saveNote = undefined;
		try {
			const response = await fetch(
				`/api/agents/${encodeURIComponent(current.id)}`,
				{
					method: "PUT",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({
						name: name.trim() || "Untitled agent",
						prompt,
						isActive,
						llmModel: llmModel || undefined,
						schedules: draftSchedules,
					}),
				},
			);
			const payload: unknown = await response.json();
			if (!response.ok) {
				throw new Error(apiErrorDetail(payload, "Unable to save agent."));
			}
			const detail =
				isRecord(payload) ? parseDetail(payload.agent) : null;
			if (!detail) throw new Error("Save returned no agent.");
			applyAgent(detail);
			saveNote = "Saved";
			toast.success("Agent saved");
		} catch (error) {
			const detail =
				error instanceof Error ? error.message : "Unable to save agent.";
			actionError = detail;
			toast.error("Couldn't save agent", { description: detail });
		} finally {
			saving = false;
		}
	}

	// ─── run presentation helpers ────────────────────────────────────────────
	function runStatusKey(status: string): "done" | "running" | "failed" | "cancelled" | "other" {
		const s = status.toUpperCase();
		if (s.includes("DONE") || s.includes("SUCCE") || s.includes("COMPLETE")) return "done";
		if (s.includes("RUN") || s.includes("PROGRESS") || s.includes("PENDING") || s.includes("QUEUE")) return "running";
		if (s.includes("FAIL") || s.includes("ERROR")) return "failed";
		if (s.includes("CANCEL")) return "cancelled";
		return "other";
	}
	function runStatusLabel(status: string): string {
		switch (runStatusKey(status)) {
			case "done": return "Completed";
			case "running": return "Running";
			case "failed": return "Failed";
			case "cancelled": return "Cancelled";
			default: return status.replace(/^STATUS_/, "").replace(/_/g, " ").toLowerCase() || "Unknown";
		}
	}
	const RUN_ICONS = {
		done: CircleCheck,
		running: Clock,
		failed: CircleX,
		cancelled: Ban,
		other: Clock,
	} as const;

	function runTimestamp(run: AgentRun): string | null {
		return run.finishedAt ?? run.startedAt ?? run.createdAt;
	}
	function formatWhen(value: string | null): string {
		if (!value) return "—";
		const date = new Date(value);
		if (Number.isNaN(date.getTime())) return "—";
		return date.toLocaleString(undefined, {
			month: "short",
			day: "numeric",
			hour: "numeric",
			minute: "2-digit",
		});
	}
	function triggerLabel(source: string | null): string {
		if (!source) return "Manual";
		return source.replace(/^TRIGGER_SOURCE_/, "").replace(/_/g, " ").toLowerCase();
	}

	afterNavigate(() => {
		syncFromRoute();
	});
</script>

<svelte:head>
	<title>{agent ? agent.name : "Agent"}</title>
</svelte:head>

{#if showLoading}
	<Page title="Agent" wide>
		<div class="state-block" aria-busy="true">
			<UnicodeSpinner label="Loading agent" />
			<p class="state-text">Loading agent…</p>
		</div>
	</Page>
{:else if showError}
	<Page title="Agent" wide>
		<div class="state-block">
			<p class="state-title">Unable to load agent</p>
			<p class="state-text">{loadError}</p>
			<a class="link-btn" href={resolve("/(chat)/agents")}>Back to agents</a>
		</div>
	</Page>
{:else if agent}
	<!-- ─── Ontology-style: run history rail (LHS) + config/run viewer (RHS) ── -->
	<Page title="" wide class="agent-page">
		{#snippet actions()}
			<a class="ghost-btn" href={resolve("/(chat)/agents")}>
				<ArrowLeft size={15} />
				<span>All agents</span>
			</a>
			{#if !runId}
				<div class="save-group">
					{#if saveNote && !isDirty}<span class="save-note">{saveNote}</span>{/if}
					<button
						type="button"
						class="primary-btn"
						disabled={saving || !isDirty || !name.trim()}
						onclick={saveAgent}
					>
						{saving ? "Saving…" : "Save"}
					</button>
				</div>
			{:else if runChatId}
				<a
					class="primary-btn"
					href={resolve("/(chat)/chat/[id]", { id: runChatId })}
				>
					<FThreadsIcon class="btn-icon" />
					<span>Open thread</span>
				</a>
			{/if}
		{/snippet}

		<div class="agent-detail">
			<!-- LHS: run history -->
			<aside class="runs-rail">
				<header class="rail-head">
					<span>History</span>
					<span class="rail-count">{runs.length}</span>
				</header>
				<div class="rail-body">
					<a
						class="rail-item"
						class:selected={!runId}
						href={resolve("/(chat)/agents/[id]", { id: agent.id })}
					>
						<Settings size={14} />
						<span class="rail-config-label">Configuration</span>
					</a>

					<div class="rail-sep">Runs</div>

					{#if runs.length === 0}
						<p class="rail-empty">No runs yet</p>
					{:else}
						{#each runs as run (run.id)}
							{@const key = runStatusKey(run.status)}
							{@const RunIcon = RUN_ICONS[key]}
							<a
								class="rail-item run"
								class:selected={runId === run.id}
								href={resolve("/(chat)/agents/[id]/run/[runId]", {
									id: agent.id,
									runId: run.id,
								})}
							>
								<span
									class="run-badge tone-{key}"
									title={runStatusLabel(run.status)}
								>
									<RunIcon size={13} />
								</span>
								<span class="rail-run-copy">
									<span class="rail-run-top">
										<span class="rail-run-status"
											>{runStatusLabel(run.status)}</span
										>
										<span class="rail-run-time"
											>{formatWhen(runTimestamp(run))}</span
										>
									</span>
									<span class="rail-run-sub">
										{triggerLabel(run.triggerSource)}
										{#if run.toolCallsCount > 0}· {run.toolCallsCount} tools{/if}
									</span>
								</span>
							</a>
						{/each}
					{/if}
				</div>
			</aside>

			<!-- RHS: config or the selected run -->
			<section class="config-viewer">
				<div class="viewer-head">
					<div class="viewer-title-row">
						<span class="viewer-avatar" aria-hidden="true">
							{#if agent.profileImageUrl}
								<img
									class="viewer-pfp"
									src={agent.profileImageUrl}
									alt=""
								/>
							{:else}
								<AgentIdenticon
									name={agent.name}
									agentId={agent.id}
									isActive={agent.isActive}
									size={28}
								/>
							{/if}
						</span>
						<h1 class="agent-title">{agent.name}</h1>
					</div>
					{#if agent.ownerName}
						<p class="agent-subtitle">{agent.ownerName}</p>
					{/if}
				</div>

				{#if runId}
					<div class="run-detail">
						<div class="run-detail-head">
							{#if selectedRun}
								{@const key = runStatusKey(selectedRun.status)}
								{@const RunIcon = RUN_ICONS[key]}
								<span class="run-badge tone-{key}">
									<RunIcon size={14} />
									{runStatusLabel(selectedRun.status)}
								</span>
							{/if}
							<span class="run-id" title={runId}>{runId}</span>
						</div>
						<AgentRunDetail
							agentId={agent.id}
							{runId}
							statusLabel={selectedRun
								? triggerLabel(selectedRun.triggerSource)
								: undefined}
							bind:chatId={runChatId}
						/>
					</div>
				{:else}
					{#if actionError}
						<p class="action-error" role="alert">{actionError}</p>
					{/if}
					<div class="config-form">
						<label class="field">
							<span class="field-label">Model</span>
							<Select
								bind:value={llmModel}
								options={modelOptions}
								aria-label="Model"
							/>
						</label>

						<div class="field">
							<span class="field-label">Webhook</span>
							{#if agent?.webhookTriggerId}
								<p class="field-hint">
									Trigger this agent from an external system using
									its webhook ID.
								</p>
								<div class="webhook-row">
									<code class="webhook-id"
										>{agent.webhookTriggerId}</code
									>
									<button
										type="button"
										class="webhook-copy"
										onclick={copyWebhookId}
									>
										<Copy size={14} />
										<span>Copy</span>
									</button>
								</div>
							{:else}
								<p class="field-hint">
									No webhook trigger is configured for this agent.
								</p>
							{/if}
						</div>

						<div class="field">
							<span class="field-label">Triggers</span>
							{#if triggers.length === 0}
								<p class="field-hint">
									No triggers — this agent only runs when triggered
									manually.
								</p>
							{/if}
							<div class="triggers">
								{#each triggers as _trigger, i (i)}
									<div class="trigger-card">
										<div class="trigger-main">
											<ScheduleEditor bind:value={triggers[i]} />
										</div>
										<button
											type="button"
											class="trigger-remove"
											aria-label="Remove trigger"
											onclick={() => removeTrigger(i)}
										>
											<X size={14} />
										</button>
									</div>
								{/each}
							</div>
							<button
								type="button"
								class="add-trigger"
								onclick={addTrigger}
							>
								<Plus size={14} />
								<span>Add trigger</span>
							</button>
						</div>

						<div class="field">
							<div class="field-head">
								<span class="field-label">Prompt</span>
								<div class="seg" role="tablist" aria-label="Prompt view">
									<button
										type="button"
										class="seg-btn"
										class:active={promptViewPref.mode === "write"}
										role="tab"
										aria-selected={promptViewPref.mode === "write"}
										onclick={() => (promptViewPref.mode = "write")}
									>
										<Pencil size={13} />
										<span>Write</span>
									</button>
									<button
										type="button"
										class="seg-btn"
										class:active={promptViewPref.mode === "preview"}
										role="tab"
										aria-selected={promptViewPref.mode === "preview"}
										onclick={() => (promptViewPref.mode = "preview")}
									>
										<Eye size={14} />
										<span>Preview</span>
									</button>
								</div>
							</div>
							{#if promptViewPref.mode === "write"}
								<textarea
									class="input textarea"
									rows="10"
									bind:value={prompt}
									placeholder="What should this agent do?"
								></textarea>
							{:else}
								<div class="input prompt-preview">
									{#if prompt.trim()}
										<Markdown content={prompt} />
									{:else}
										<p class="prompt-preview-empty">
											Nothing to preview yet.
										</p>
									{/if}
								</div>
							{/if}
						</div>
					</div>
				{/if}
			</section>
		</div>
	</Page>
{/if}

<style>
	.agent-detail {
		display: grid;
		grid-template-columns: minmax(220px, 300px) 1fr;
		/* Explicit row so the panes stretch to full height. */
		grid-template-rows: minmax(0, 1fr);
		gap: 1rem;
		flex: 1;
		min-height: 0;
	}

	@media (max-width: 760px) {
		.agent-detail {
			grid-template-columns: minmax(0, 1fr);
			grid-template-rows: auto minmax(0, 1fr);
		}
	}

	/* LHS: run history rail */
	.runs-rail {
		display: flex;
		flex-direction: column;
		min-height: 0;
		border: 1px solid var(--color-line);
		border-radius: var(--radius-sm, 10px);
		background: color-mix(in srgb, var(--color-ink) 2.5%, transparent);
		overflow: hidden;
	}

	.rail-head {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		padding: 0.6rem 0.75rem;
		border-bottom: 1px solid var(--color-line);
		color: var(--color-muted);
		font-size: 12px;
		font-weight: 600;
	}

	.rail-count {
		font-family: var(--font-mono, ui-monospace, monospace);
		font-size: 11px;
		font-weight: 500;
	}

	.rail-body {
		flex: 1;
		min-height: 0;
		overflow-y: auto;
		padding: 0.35rem;
	}

	.rail-item {
		display: flex;
		align-items: center;
		gap: 9px;
		width: 100%;
		padding: 8px;
		border-radius: var(--radius-sm);
		color: var(--color-ink);
		text-decoration: none;
		cursor: pointer;
		transition: background 120ms ease;
	}

	.rail-item:hover {
		background: color-mix(in srgb, var(--color-elevate) 70%, transparent);
	}

	.rail-item.selected {
		background: color-mix(in srgb, var(--color-accent) 12%, transparent);
	}

	.rail-config-label {
		font-size: 13px;
		font-weight: 500;
	}

	.rail-sep {
		padding: 10px 8px 4px;
		color: var(--color-muted);
		font-size: 10.5px;
		font-weight: 600;
		letter-spacing: 0.06em;
		text-transform: uppercase;
	}

	.rail-empty {
		margin: 0;
		padding: 8px;
		color: var(--color-muted);
		font-size: 12px;
	}

	/* RHS: config / run viewer */
	.config-viewer {
		min-height: 0;
		overflow-y: auto;
		padding: 4px 2px;
	}

	.viewer-head {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 8px;
		margin-bottom: 20px;
	}

	.viewer-title-row {
		display: flex;
		align-items: center;
		gap: 10px;
		min-width: 0;
	}

	.viewer-avatar {
		display: inline-flex;
		flex-shrink: 0;
		width: 28px;
		height: 28px;
		border-radius: var(--radius-sm);
		overflow: hidden;
	}

	.viewer-pfp {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.agent-title {
		margin: 0;
		color: var(--color-ink);
		font-size: 18px;
		font-weight: 650;
		line-height: 1.2;
	}

	.agent-subtitle {
		margin: 0;
		color: var(--color-muted);
		font-size: 12.5px;
	}

	.config-form {
		display: flex;
		flex-direction: column;
		gap: 16px;
		width: 100%;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 6px;
		min-width: 0;
	}

	.field-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
	}

	.field-label {
		color: var(--color-muted);
		font-size: 11.5px;
		font-weight: 500;
	}

	.field-hint {
		color: var(--color-muted);
		font-size: 11px;
		line-height: 1.4;
	}

	/* Webhook trigger — read-only identifier with copy action */
	.webhook-row {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-top: 6px;
	}

	.webhook-id {
		flex: 1;
		min-width: 0;
		overflow-x: auto;
		white-space: nowrap;
		padding: 8px 10px;
		border: 1px solid color-mix(in srgb, var(--color-line) 90%, transparent);
		border-radius: var(--radius-sm);
		background: color-mix(in srgb, var(--color-ink) 2%, transparent);
		font-family: var(--font-mono, ui-monospace, monospace);
		font-size: 12px;
		color: var(--color-ink);
	}

	.webhook-copy {
		display: inline-flex;
		align-items: center;
		flex-shrink: 0;
		gap: 6px;
		padding: 8px 10px;
		border: 1px solid color-mix(in srgb, var(--color-line) 90%, transparent);
		border-radius: var(--radius-sm);
		background: transparent;
		color: var(--color-muted);
		font: inherit;
		font-size: 12.5px;
		cursor: pointer;
		transition:
			background 120ms ease,
			color 120ms ease;
	}

	.webhook-copy:hover {
		color: var(--color-ink);
		background: color-mix(in srgb, var(--color-ink) 4%, transparent);
	}

	/* Trigger cards — one configurable schedule each */
	.triggers {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.trigger-card {
		display: flex;
		align-items: flex-start;
		gap: 8px;
		padding: 10px;
		border: 1px solid color-mix(in srgb, var(--color-line) 90%, transparent);
		border-radius: var(--radius-sm);
		background: color-mix(in srgb, var(--color-ink) 2%, transparent);
	}

	.trigger-main {
		display: flex;
		flex-direction: column;
		gap: 8px;
		flex: 1;
		min-width: 0;
	}

	.trigger-remove {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		width: 28px;
		height: 28px;
		border: 0;
		border-radius: var(--radius-sm);
		background: transparent;
		color: var(--color-muted);
		cursor: pointer;
		transition:
			background 120ms ease,
			color 120ms ease;
	}

	.trigger-remove:hover {
		color: var(--color-ink);
		background: color-mix(in srgb, var(--color-ink) 6%, transparent);
	}

	.add-trigger {
		display: inline-flex;
		align-items: center;
		align-self: flex-start;
		gap: 6px;
		margin-top: 8px;
		padding: 6px 10px;
		border: 1px dashed color-mix(in srgb, var(--color-line) 90%, transparent);
		border-radius: var(--radius-sm);
		background: transparent;
		color: var(--color-muted);
		font: inherit;
		font-size: 12.5px;
		cursor: pointer;
		transition:
			background 120ms ease,
			color 120ms ease;
	}

	.add-trigger:hover {
		color: var(--color-ink);
		background: color-mix(in srgb, var(--color-ink) 4%, transparent);
	}

	/* Write / Preview segmented toggle (shared choice via promptViewPref) */
	.seg {
		display: inline-flex;
		padding: 2px;
		border: 1px solid color-mix(in srgb, var(--color-line) 85%, transparent);
		border-radius: 8px;
		background: color-mix(in srgb, var(--color-ink) 3%, transparent);
	}

	.seg-btn {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		padding: 3px 10px;
		border: 0;
		border-radius: 6px;
		background: transparent;
		color: var(--color-muted);
		font: inherit;
		font-size: 11.5px;
		font-weight: 500;
		cursor: pointer;
		transition:
			background 120ms ease,
			color 120ms ease;
	}

	.seg-btn:hover {
		color: var(--color-ink);
	}

	.seg-btn.active {
		background: color-mix(in srgb, var(--color-elevate) 92%, transparent);
		color: var(--color-ink);
		box-shadow: 0 1px 2px color-mix(in srgb, var(--color-ink) 12%, transparent);
	}

	.prompt-preview {
		min-height: 200px;
		overflow-y: auto;
	}

	.prompt-preview-empty {
		margin: 0;
		color: var(--color-muted);
		font-size: 13px;
		font-style: italic;
	}

	.input {
		width: 100%;
		padding: 8px 10px;
		border: 1px solid color-mix(in srgb, var(--color-line) 90%, transparent);
		border-radius: var(--radius-sm);
		background: var(--color-paper);
		color: var(--color-ink);
		font: inherit;
		font-size: 13px;
	}

	.input:focus {
		outline: none;
		border-color: var(--color-accent);
	}

	.textarea {
		resize: vertical;
		line-height: 1.5;
	}

	/* rail run rows */
	.rail-run-copy {
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0;
	}

	.rail-run-top {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 8px;
	}

	.rail-run-status {
		color: var(--color-ink);
		font-size: 12.5px;
		font-weight: 500;
	}

	.rail-run-time {
		flex-shrink: 0;
		color: var(--color-muted);
		font-size: 10.5px;
		white-space: nowrap;
	}

	.rail-run-sub {
		overflow: hidden;
		color: var(--color-muted);
		font-size: 11px;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.run-badge {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		padding: 3px 6px;
		border-radius: 999px;
		font-size: 11px;
		font-weight: 500;
	}

	.tone-done {
		color: #16794a;
		background: color-mix(in srgb, #16794a 12%, transparent);
	}

	.tone-running {
		color: #1d5fb0;
		background: color-mix(in srgb, #1d5fb0 12%, transparent);
	}

	.tone-failed {
		color: #b0341d;
		background: color-mix(in srgb, #b0341d 12%, transparent);
	}

	.tone-cancelled,
	.tone-other {
		color: var(--color-muted);
		background: color-mix(in srgb, var(--color-line) 40%, transparent);
	}

	/* run detail */
	.run-detail {
		display: flex;
		flex-direction: column;
		gap: 20px;
		width: 100%;
	}

	.run-detail-head {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.run-id {
		overflow: hidden;
		color: var(--color-muted);
		font-family: var(--font-mono, ui-monospace, monospace);
		font-size: 12px;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	/* buttons */
	.ghost-btn,
	.primary-btn,
	.link-btn {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		border: 0;
		border-radius: var(--radius-sm);
		font: inherit;
		font-size: 12.5px;
		cursor: pointer;
	}

	.ghost-btn {
		padding: 6px 10px;
		color: var(--color-muted);
		background: transparent;
	}

	.ghost-btn:hover {
		color: var(--color-ink);
		background: color-mix(in srgb, var(--color-elevate) 60%, transparent);
	}

	.primary-btn {
		padding: 6px 14px;
		color: #fff;
		background: var(--color-accent);
	}

	.primary-btn:disabled {
		opacity: 0.5;
		cursor: default;
	}

	.primary-btn :global(.btn-icon) {
		font-size: 14px;
	}

	.link-btn {
		align-self: flex-start;
		padding: 6px 10px;
		color: var(--color-accent);
		background: transparent;
	}

	.link-btn:hover {
		background: color-mix(in srgb, var(--color-elevate) 60%, transparent);
	}

	.save-note {
		color: #16794a;
		font-size: 12px;
	}

	.save-group {
		display: inline-flex;
		align-items: center;
		gap: 8px;
	}

	/* Stretch the header action row so "All agents" sits at the start and the
	   save cluster at the end. Scoped to this page via the `agent-page` class. */
	:global(.agent-page .actions) {
		flex: 1;
		justify-content: space-between;
	}

	.action-error {
		margin: 0 0 14px;
		padding: 8px 12px;
		border-radius: var(--radius-sm);
		color: #b0341d;
		background: color-mix(in srgb, #b0341d 8%, transparent);
		font-size: 12.5px;
	}

	/* states */
	.state-block {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 10px;
		padding: 48px 16px;
		text-align: center;
	}

	.state-block.compact {
		padding: 24px 16px;
	}

	.state-title {
		margin: 0;
		color: var(--color-ink);
		font-size: 15px;
		font-weight: 500;
	}

	.state-text {
		margin: 0;
		color: var(--color-muted);
		font-size: 13px;
		line-height: 1.45;
	}
</style>
