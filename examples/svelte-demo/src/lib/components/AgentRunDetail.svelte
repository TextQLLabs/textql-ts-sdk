<script lang="ts">
	import EgressTable from "$lib/components/EgressTable.svelte";
	import Markdown from "$lib/components/Markdown.svelte";
	import RunTimeline from "$lib/components/RunTimeline.svelte";
	import UnicodeSpinner from "$lib/components/UnicodeSpinner.svelte";
	import { formatDurationMs } from "$lib/runFormat";
	import { isRecord } from "$lib/utils";

	type RunStep = {
		tool: string;
		summary: string | null;
		error: string | null;
		cellId: string | null;
		durationMs: number;
		startedAtMs: number;
	};
	type EgressCall = {
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

	let {
		agentId,
		runId,
		statusLabel,
		chatId = $bindable(),
	}: {
		agentId: string;
		runId: string;
		statusLabel?: string;
		/** Lifted to the parent so the "Open thread" action can live in the header. */
		chatId?: string | null;
	} = $props();

	let detail = $state.raw<RunDetail | undefined>();
	let resolvedFor = $state<string | undefined>();
	let loading = $state(false);
	let error = $state<string | undefined>();
	let tab = $state<"timeline" | "network">("timeline");

	function parseDetail(value: unknown): RunDetail | null {
		if (!isRecord(value) || typeof value.id !== "string") return null;
		const steps = Array.isArray(value.steps)
			? (value.steps.filter(isRecord) as unknown as RunStep[])
			: [];
		const egress = Array.isArray(value.egress)
			? (value.egress.filter(isRecord) as unknown as EgressCall[])
			: [];
		return {
			id: value.id,
			status: typeof value.status === "string" ? value.status : "STATUS_UNKNOWN",
			chatId: typeof value.chatId === "string" ? value.chatId : null,
			toolCallsCount:
				typeof value.toolCallsCount === "number" ? value.toolCallsCount : 0,
			lastSummary:
				typeof value.lastSummary === "string" ? value.lastSummary : null,
			errorKind: typeof value.errorKind === "string" ? value.errorKind : null,
			errorMessage:
				typeof value.errorMessage === "string" ? value.errorMessage : null,
			startedAt: typeof value.startedAt === "string" ? value.startedAt : null,
			finishedAt: typeof value.finishedAt === "string" ? value.finishedAt : null,
			steps,
			egress,
			trigger: (value.trigger as RunTrigger | null) ?? null,
		};
	}

	$effect(() => {
		const id = runId;
		const agent = agentId;
		if (!id || !agent) return;
		if (resolvedFor === id && detail) return;

		const controller = new AbortController();
		loading = true;
		error = undefined;
		chatId = undefined;
		fetch(
			`/api/agents/${encodeURIComponent(agent)}/run/${encodeURIComponent(id)}`,
			{ signal: controller.signal },
		)
			.then(async (response) => {
				const payload: unknown = await response.json();
				if (!response.ok || !isRecord(payload)) {
					throw new Error(
						isRecord(payload) && typeof payload.error === "string"
							? payload.error
							: "Unable to load run.",
					);
				}
				const parsed = parseDetail(payload.run);
				if (!parsed) throw new Error("Run not found.");
				detail = parsed;
				chatId = parsed.chatId ?? undefined;
				resolvedFor = id;
			})
			.catch((err: unknown) => {
				if (err instanceof DOMException && err.name === "AbortError") return;
				error = err instanceof Error ? err.message : "Unable to load run.";
			})
			.finally(() => {
				loading = false;
			});

		return () => controller.abort();
	});

	const durationText = $derived.by(() => {
		const d = detail;
		if (!d?.startedAt || !d?.finishedAt) return "—";
		const ms = new Date(d.finishedAt).getTime() - new Date(d.startedAt).getTime();
		return ms >= 0 ? formatDurationMs(ms) : "—";
	});

	const geoLabel = $derived.by(() => {
		const t = detail?.trigger;
		if (!t) return null;
		const parts = [t.city, t.region, t.country ?? t.countryCode].filter(Boolean);
		return parts.length ? parts.join(", ") : null;
	});

	const metaRows = $derived.by(() => {
		const t = detail?.trigger;
		if (!t) return [] as { label: string; value: string }[];
		const rows: { label: string; value: string }[] = [];
		if (t.ip) rows.push({ label: "Origin IP", value: t.ip });
		if (geoLabel) rows.push({ label: "Location", value: geoLabel });
		if (t.userAgent) rows.push({ label: "User agent", value: t.userAgent });
		return rows;
	});
</script>

{#if loading && !detail}
	<div class="state">
		<UnicodeSpinner label="Loading run" />
		<p class="state-text">Loading run…</p>
	</div>
{:else if error && !detail}
	<div class="state">
		<p class="state-title">Unable to load run</p>
		<p class="state-text">{error}</p>
	</div>
{:else if detail}
	<div class="run">
		{#if detail.lastSummary}
			<div class="summary"><Markdown content={detail.lastSummary} /></div>
		{/if}

		<div class="facts">
			<span>duration <strong>{durationText}</strong></span>
			<span class="sep"></span>
			<span>steps <strong>{detail.steps.length || detail.toolCallsCount}</strong></span>
			{#if detail.egress.length > 0}
				<span class="sep"></span>
				<span>network calls <strong>{detail.egress.length}</strong></span>
			{/if}
			{#if statusLabel}
				<span class="sep"></span>
				<span>{statusLabel}</span>
			{/if}
		</div>

		{#if metaRows.length > 0}
			<dl class="trigger-meta">
				{#each metaRows as row (row.label)}
					<dt>{row.label}</dt>
					<dd>{row.value}</dd>
				{/each}
			</dl>
		{/if}

		{#if detail.errorMessage || detail.errorKind}
			<div class="error-box">
				{#if detail.errorKind}<p class="error-kind">{detail.errorKind}</p>{/if}
				{#if detail.errorMessage}<p class="error-msg">{detail.errorMessage}</p>{/if}
			</div>
		{/if}

		<div class="tabs" role="tablist">
			<button
				type="button"
				class="tab"
				class:active={tab === "timeline"}
				role="tab"
				aria-selected={tab === "timeline"}
				onclick={() => (tab = "timeline")}
			>
				Timeline
			</button>
			<button
				type="button"
				class="tab"
				class:active={tab === "network"}
				role="tab"
				aria-selected={tab === "network"}
				onclick={() => (tab = "network")}
			>
				Network
				{#if detail.egress.length > 0}
					<span class="tab-count">{detail.egress.length}</span>
				{/if}
			</button>
		</div>

		<div class="tab-body">
			{#if tab === "timeline"}
				<RunTimeline steps={detail.steps} />
			{:else}
				<EgressTable calls={detail.egress} />
			{/if}
		</div>
	</div>
{/if}

<style>
	.run {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.summary {
		font-size: 13px;
		line-height: 1.55;
	}

	.facts {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 10px;
		color: var(--color-muted);
		font-size: 12px;
	}

	.facts strong {
		color: var(--color-ink);
		font-weight: 600;
	}

	.sep {
		width: 1px;
		height: 12px;
		background: var(--color-line);
	}

	.trigger-meta {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 4px 16px;
		margin: 0;
		padding: 10px 12px;
		border: 1px solid var(--color-line);
		border-radius: var(--radius-sm);
		background: color-mix(in srgb, var(--color-ink) 2%, transparent);
		font-size: 12px;
	}

	.trigger-meta dt {
		color: var(--color-muted);
		font-weight: 500;
	}

	.trigger-meta dd {
		margin: 0;
		color: var(--color-ink);
		font-family: var(--font-mono, ui-monospace, monospace);
		overflow-wrap: anywhere;
	}

	.error-box {
		padding: 10px 12px;
		border: 1px solid color-mix(in srgb, #b91c1c 30%, transparent);
		border-radius: var(--radius-sm);
		background: color-mix(in srgb, #b91c1c 6%, transparent);
	}

	.error-kind {
		margin: 0 0 4px;
		color: #b91c1c;
		font-size: 12px;
		font-weight: 600;
	}

	.error-msg {
		margin: 0;
		color: var(--color-ink);
		font-family: var(--font-mono, ui-monospace, monospace);
		font-size: 12px;
		line-height: 1.5;
		white-space: pre-wrap;
	}

	.tabs {
		display: flex;
		gap: 18px;
		border-bottom: 1px solid var(--color-line);
	}

	.tab {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		margin-bottom: -1px;
		padding: 8px 2px;
		border: 0;
		border-bottom: 2px solid transparent;
		background: transparent;
		color: var(--color-muted);
		font: inherit;
		font-size: 13px;
		cursor: pointer;
		transition: color 120ms ease;
	}

	.tab:hover {
		color: var(--color-ink);
	}

	.tab.active {
		border-bottom-color: var(--color-ink);
		color: var(--color-ink);
		font-weight: 500;
	}

	.tab-count {
		padding: 0 5px;
		border-radius: 999px;
		background: color-mix(in srgb, var(--color-ink) 8%, transparent);
		font-size: 10.5px;
		font-variant-numeric: tabular-nums;
	}

	.state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 10px;
		padding: 48px 16px;
		text-align: center;
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
	}
</style>
