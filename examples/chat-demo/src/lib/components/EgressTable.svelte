<script lang="ts">
	import ChevronRight from "@lucide/svelte/icons/chevron-right";
	import Globe from "@lucide/svelte/icons/globe";
	import { formatBytes, formatDurationMs } from "$lib/runFormat";

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

	// Calls must be oldest-first so the waterfall reads chronologically.
	let {
		calls = [],
		emptyDescription = "This run hasn't made any outbound HTTP requests.",
	}: { calls?: EgressCall[]; emptyDescription?: string } = $props();

	let expanded = $state<Record<string, boolean>>({});
	function toggle(id: string) {
		expanded = { ...expanded, [id]: !expanded[id] };
	}

	function startMs(call: EgressCall): number {
		return call.occurredAt ? new Date(call.occurredAt).getTime() : 0;
	}
	const t0 = $derived(calls.length ? Math.min(...calls.map(startMs)) : 0);
	const t1 = $derived(
		calls.length
			? Math.max(...calls.map((c) => startMs(c) + c.durationMs))
			: 0,
	);
	const span = $derived(Math.max(1, t1 - t0));

	const MIN_BAR_PCT = 1.5;
	function barStyle(call: EgressCall): string {
		const left = ((startMs(call) - t0) / span) * 100;
		let width = (call.durationMs / span) * 100;
		if (width < MIN_BAR_PCT) width = MIN_BAR_PCT;
		if (left + width > 100) width = Math.max(MIN_BAR_PCT, 100 - left);
		return `left:${left}%;width:${width}%`;
	}

	function severity(call: EgressCall): "ok" | "denied" | "error" {
		if (call.outcome === "denied") return "denied";
		if (call.outcome !== "ok" || call.statusCode >= 400) return "error";
		return "ok";
	}
	function statusText(call: EgressCall): string {
		if (call.outcome === "denied") return "denied";
		if (call.statusCode > 0) return String(call.statusCode);
		return call.outcome;
	}
	function formatClock(iso: string | null): string {
		if (!iso) return "—";
		const d = new Date(iso);
		if (Number.isNaN(d.getTime())) return "—";
		const p = (n: number, len = 2) => String(n).padStart(len, "0");
		return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}.${p(d.getMilliseconds(), 3)}`;
	}

	const counts = $derived.by(() => {
		const acc: Record<string, number> = {};
		for (const call of calls) {
			const sev = severity(call);
			acc[sev] = (acc[sev] ?? 0) + 1;
		}
		return acc;
	});
</script>

{#if calls.length === 0}
	<div class="empty">
		<span class="empty-icon"><Globe size={22} /></span>
		<p class="empty-title">No network calls recorded</p>
		<p class="empty-text">{emptyDescription}</p>
	</div>
{:else}
	<div class="egress">
		<div class="row head">
			<span></span>
			<span>Method</span>
			<span>Host</span>
			<span>Status</span>
			<span>Time</span>
			<span>Timeline</span>
			<span class="right">Duration</span>
		</div>

		<div class="rows">
			{#each calls as call (call.id)}
				{@const open = expanded[call.id]}
				{@const sev = severity(call)}
				<div class="call">
					<button class="row body" onclick={() => toggle(call.id)} aria-expanded={open}>
						<ChevronRight size={13} class={open ? "chev open" : "chev"} />
						<span class="mono method">{call.method}</span>
						<span class="host">
							<span class="host-name">{call.host}</span><span class="host-path"
								>{call.path}</span
							>
						</span>
						<span>
							<span class="badge tone-{sev}">{statusText(call)}</span>
						</span>
						<span class="mono time">{formatClock(call.occurredAt)}</span>
						<span class="track">
							<span class="bar tone-{sev}" style={barStyle(call)}></span>
						</span>
						<span class="mono right dur">{formatDurationMs(call.durationMs)}</span>
					</button>
					{#if open}
						<dl class="detail">
							<dt>URL</dt>
							<dd class="mono break">{call.scheme}://{call.host}{call.path}</dd>
							<dt>Status</dt>
							<dd>{call.statusCode > 0 ? call.statusCode : "—"} · {call.outcome}</dd>
							<dt>Request</dt>
							<dd class="mono">{formatBytes(call.requestBytes)}</dd>
							<dt>Response</dt>
							<dd class="mono">{formatBytes(call.responseBytes)}</dd>
							{#if call.cellId}
								<dt>Cell</dt>
								<dd class="mono break">{call.cellId}</dd>
							{/if}
						</dl>
					{/if}
				</div>
			{/each}
		</div>

		<div class="foot">
			<span class="mono">{calls.length} call{calls.length === 1 ? "" : "s"}</span>
			{#if counts.ok}<span class="tone-ok">{counts.ok} ok</span>{/if}
			{#if counts.denied}<span class="tone-denied">{counts.denied} denied</span>{/if}
			{#if counts.error}<span class="tone-error">{counts.error} error</span>{/if}
		</div>
	</div>
{/if}

<style>
	.egress {
		display: flex;
		flex-direction: column;
		border: 1px solid var(--color-line);
		border-radius: var(--radius-sm);
		overflow: hidden;
	}

	.row {
		display: grid;
		grid-template-columns: 18px 52px minmax(0, 1.4fr) 64px 96px minmax(0, 2fr) 64px;
		align-items: center;
		gap: 12px;
		padding: 7px 12px;
		text-align: left;
	}

	.head {
		color: var(--color-muted);
		background: color-mix(in srgb, var(--color-ink) 3%, transparent);
		border-bottom: 1px solid var(--color-line);
		font-size: 10px;
		font-weight: 600;
		letter-spacing: 0.05em;
		text-transform: uppercase;
	}

	.rows {
		display: flex;
		flex-direction: column;
	}

	.call {
		border-bottom: 1px solid
			color-mix(in srgb, var(--color-line) 60%, transparent);
	}

	.call:last-child {
		border-bottom: 0;
	}

	.row.body {
		width: 100%;
		border: 0;
		background: transparent;
		font: inherit;
		font-size: 12px;
		cursor: pointer;
	}

	.row.body:hover {
		background: color-mix(in srgb, var(--color-ink) 3%, transparent);
	}

	.row.body :global(.chev) {
		color: var(--color-muted);
		transition: transform 120ms ease;
	}

	.row.body :global(.chev.open) {
		transform: rotate(90deg);
	}

	.mono {
		font-family: var(--font-mono, ui-monospace, monospace);
	}

	.method {
		color: var(--color-muted);
		font-size: 11px;
	}

	.host {
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.host-name {
		color: var(--color-ink);
	}

	.host-path {
		color: var(--color-muted);
	}

	.badge {
		padding: 1px 6px;
		border-radius: 4px;
		font-size: 11px;
		font-weight: 500;
		font-variant-numeric: tabular-nums;
	}

	.time {
		color: var(--color-muted);
		font-size: 11px;
	}

	.track {
		position: relative;
		display: block;
		height: 16px;
	}

	.bar {
		position: absolute;
		top: 50%;
		height: 6px;
		transform: translateY(-50%);
		border-radius: 2px;
	}

	.right {
		text-align: right;
	}

	.dur {
		color: var(--color-ink);
		font-size: 11px;
		font-variant-numeric: tabular-nums;
	}

	.tone-ok.badge {
		color: #15803d;
		background: color-mix(in srgb, #15803d 12%, transparent);
	}
	.tone-denied.badge {
		color: #b45309;
		background: color-mix(in srgb, #b45309 14%, transparent);
	}
	.tone-error.badge {
		color: #b91c1c;
		background: color-mix(in srgb, #b91c1c 12%, transparent);
	}
	.bar.tone-ok {
		background: #4ade80;
	}
	.bar.tone-denied {
		background: #fbbf24;
	}
	.bar.tone-error {
		background: #f87171;
	}

	.detail {
		display: grid;
		grid-template-columns: 84px minmax(0, 1fr);
		gap: 4px 12px;
		margin: 0;
		padding: 8px 12px 12px 42px;
		background: color-mix(in srgb, var(--color-ink) 2%, transparent);
		font-size: 12px;
	}

	.detail dt {
		color: var(--color-muted);
	}

	.detail dd {
		margin: 0;
		color: var(--color-ink);
	}

	.break {
		overflow-wrap: anywhere;
	}

	.foot {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 8px 12px;
		border-top: 1px solid var(--color-line);
		color: var(--color-muted);
		font-size: 11.5px;
	}

	.foot .tone-ok {
		color: #15803d;
	}
	.foot .tone-denied {
		color: #b45309;
	}
	.foot .tone-error {
		color: #b91c1c;
	}

	.empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 8px;
		padding: 40px 16px;
		text-align: center;
	}

	.empty-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 48px;
		height: 48px;
		border-radius: 999px;
		color: var(--color-muted);
		background: color-mix(in srgb, var(--color-ink) 5%, transparent);
	}

	.empty-title {
		margin: 0;
		color: var(--color-ink);
		font-size: 13px;
		font-weight: 600;
	}

	.empty-text {
		margin: 0;
		max-width: 280px;
		color: var(--color-muted);
		font-size: 12.5px;
		line-height: 1.45;
	}
</style>
