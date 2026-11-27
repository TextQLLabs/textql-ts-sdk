<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { BadgeTone } from './types';

	let {
		tone = 'neutral',
		class: className = '',
		children
	}: { tone?: BadgeTone; class?: string; children?: Snippet } = $props();
</script>

<span class={`badge ${className}`} data-tone={tone}>{@render children?.()}</span>

<style>
	.badge { display: inline-flex; align-items: center; gap: 4px; border-radius: 6px; padding: 3px 6px; font-size: 9.5px; font-weight: 500; line-height: 1.2; white-space: nowrap; }
	.badge[data-tone='neutral'] { background: var(--color-fill); color: var(--color-muted); }
	.badge[data-tone='accent'] { background: var(--color-access-soft); color: #2563eb; }
	.badge[data-tone='success'] { background: var(--color-decision-soft); color: var(--color-decision); }
	.badge[data-tone='warning'] { background: var(--color-warning-soft); color: var(--color-warning); }
	.badge[data-tone='danger'] { background: var(--color-danger-soft); color: var(--color-danger); }
</style>
