<script lang="ts">
	import Activity from "@lucide/svelte/icons/activity";
	import { formatDurationMs } from "$lib/runFormat";

	type RunStep = {
		tool: string;
		summary: string | null;
		error: string | null;
		cellId: string | null;
		durationMs: number;
		startedAtMs: number;
	};

	let { steps = [] }: { steps?: RunStep[] } = $props();

	// Lay steps out on a shared time axis. When the backend gives real start
	// offsets we honor them; otherwise we stack sequentially by duration so the
	// waterfall still reads left-to-right.
	type Laid = RunStep & { startPct: number; widthPct: number };

	const laid = $derived.by((): Laid[] => {
		if (steps.length === 0) return [];
		const hasClock = steps.some((s) => s.startedAtMs > 0);

		if (hasClock) {
			const t0 = Math.min(...steps.map((s) => s.startedAtMs || 0));
			const t1 = Math.max(
				...steps.map((s) => (s.startedAtMs || 0) + s.durationMs),
			);
			const span = Math.max(1, t1 - t0);
			return steps.map((s) => {
				const left = (((s.startedAtMs || 0) - t0) / span) * 100;
				const width = Math.max(1.5, (s.durationMs / span) * 100);
				return { ...s, startPct: left, widthPct: Math.min(width, 100 - left) };
			});
		}

		const total = Math.max(1, steps.reduce((sum, s) => sum + s.durationMs, 0));
		let cursor = 0;
		return steps.map((s) => {
			const left = (cursor / total) * 100;
			const width = Math.max(1.5, (s.durationMs / total) * 100);
			cursor += s.durationMs;
			return { ...s, startPct: left, widthPct: Math.min(width, 100 - left) };
		});
	});
</script>

{#if laid.length === 0}
	<div class="empty">
		<span class="empty-icon"><Activity size={22} /></span>
		<p class="empty-title">No steps recorded</p>
		<p class="empty-text">This run didn't record any tool calls.</p>
	</div>
{:else}
	<ol class="timeline">
		{#each laid as step, i (i)}
			<li class="step" class:failed={step.error}>
				<div class="step-head">
					<span class="step-index">{i + 1}</span>
					<span class="step-tool">{step.tool}</span>
					<span class="step-dur">{formatDurationMs(step.durationMs)}</span>
				</div>
				<div class="track">
					<span
						class="bar"
						class:failed={step.error}
						style="left:{step.startPct}%;width:{step.widthPct}%"
					></span>
				</div>
				{#if step.summary}
					<p class="step-summary">{step.summary}</p>
				{/if}
				{#if step.error}
					<p class="step-error">{step.error}</p>
				{/if}
			</li>
		{/each}
	</ol>
{/if}

<style>
	.timeline {
		display: flex;
		flex-direction: column;
		gap: 10px;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.step {
		display: flex;
		flex-direction: column;
		gap: 6px;
		padding: 10px 12px;
		border: 1px solid color-mix(in srgb, var(--color-line) 90%, transparent);
		border-radius: var(--radius-sm);
		background: color-mix(in srgb, var(--color-ink) 2%, transparent);
	}

	.step.failed {
		border-color: color-mix(in srgb, #b91c1c 35%, var(--color-line));
	}

	.step-head {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.step-index {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		width: 18px;
		height: 18px;
		border-radius: 999px;
		color: var(--color-muted);
		background: color-mix(in srgb, var(--color-ink) 7%, transparent);
		font-size: 10.5px;
		font-variant-numeric: tabular-nums;
	}

	.step-tool {
		flex: 1;
		min-width: 0;
		overflow: hidden;
		color: var(--color-ink);
		font-family: var(--font-mono, ui-monospace, monospace);
		font-size: 12.5px;
		font-weight: 500;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.step-dur {
		flex-shrink: 0;
		color: var(--color-muted);
		font-size: 11px;
		font-variant-numeric: tabular-nums;
	}

	.track {
		position: relative;
		height: 8px;
		border-radius: 3px;
		background: color-mix(in srgb, var(--color-ink) 5%, transparent);
	}

	.bar {
		position: absolute;
		top: 0;
		height: 100%;
		min-width: 3px;
		border-radius: 3px;
		background: var(--color-accent, #4c6ef5);
	}

	.bar.failed {
		background: #f87171;
	}

	.step-summary {
		margin: 0;
		color: var(--color-muted);
		font-size: 12px;
		line-height: 1.45;
	}

	.step-error {
		margin: 0;
		color: #b91c1c;
		font-family: var(--font-mono, ui-monospace, monospace);
		font-size: 11.5px;
		line-height: 1.45;
		white-space: pre-wrap;
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
		color: var(--color-muted);
		font-size: 12.5px;
	}
</style>
