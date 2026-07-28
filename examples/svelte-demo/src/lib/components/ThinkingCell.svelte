<script lang="ts">
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import type { CellLike } from '$lib/cells';
	import { getCellPayload } from '$lib/cells';

	let {
		cell,
		active = false
	}: {
		cell: CellLike;
		/** True while this thinking segment is still streaming. */
		active?: boolean;
	} = $props();

	const payload = $derived(getCellPayload(cell));
	const redacted = $derived(payload.redacted === true);
	const content = $derived(
		typeof payload.content === 'string' ? payload.content.trim() : ''
	);
	const hasContent = $derived(redacted || content.length > 0);
	const isThinking = $derived(active && !cell.complete);

	let expanded = $state(false);
	let openedManually = $state(false);

	// Live thoughts stay open while streaming...
	$effect(() => {
		if (isThinking) expanded = true;
	});

	// ...then tuck away shortly after, unless the user opened them on purpose.
	$effect(() => {
		if (isThinking || !expanded || openedManually || !hasContent) return;
		const timeout = setTimeout(() => {
			expanded = false;
		}, 2000);
		return () => clearTimeout(timeout);
	});

	const visible = $derived(isThinking || hasContent);
	const showBody = $derived(expanded && hasContent);
	const bodyText = $derived(redacted ? 'Thinking (redacted)' : content);

	function toggle() {
		expanded = !expanded;
		openedManually = expanded;
	}
</script>

{#if visible}
	<div class="thinking">
		{#if isThinking}
			<div class="thinking-row">
				<span class="thinking-label shimmer">Thinking…</span>
			</div>
		{:else}
			<button type="button" class="thinking-toggle" onclick={toggle}>
				<ChevronRight size={14} class={['chevron', expanded && 'open']} />
				<span class="thinking-label">Thought process</span>
			</button>
		{/if}

		{#if showBody}
			<pre class="thinking-body">{bodyText}</pre>
		{/if}
	</div>
{/if}

<style>
	.thinking {
		width: 100%;
	}

	.thinking-row,
	.thinking-toggle {
		display: flex;
		align-items: center;
		gap: 6px;
		width: 100%;
		min-height: 32px;
		padding: 4px 6px;
		border: 0;
		border-radius: var(--radius-sm, 8px);
		background: transparent;
		font: inherit;
		text-align: left;
	}

	.thinking-toggle {
		cursor: pointer;
	}

	.thinking-toggle:hover {
		background: color-mix(in srgb, var(--color-ink) 4%, transparent);
	}

	.thinking-toggle :global(.chevron) {
		flex-shrink: 0;
		color: #a1a1aa;
		transition: transform 0.15s ease;
	}

	.thinking-toggle :global(.chevron.open) {
		transform: rotate(90deg);
	}

	.thinking-label {
		overflow: hidden;
		min-width: 0;
		color: var(--color-muted);
		font-size: 13px;
		font-weight: 500;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	/* .shimmer comes from app.css */

	@media (prefers-reduced-motion: reduce) {
		.thinking-toggle :global(.chevron) {
			transition: none;
		}
	}

	.thinking-body {
		margin: 0;
		padding: 2px 8px 8px 22px;
		border-left: 2px solid var(--color-line);
		margin-left: 12px;
		color: #a1a1aa;
		font-family: inherit;
		font-size: 12.5px;
		font-style: italic;
		line-height: 1.55;
		white-space: pre-wrap;
		overflow-wrap: anywhere;
	}
</style>
