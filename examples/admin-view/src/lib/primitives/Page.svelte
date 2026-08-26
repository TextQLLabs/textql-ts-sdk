<script lang="ts">
	import type { Snippet } from 'svelte';

	let { title, lead, wide = false, class: className = '', actions, children }: {
		title: string;
		lead?: string;
		wide?: boolean;
		class?: string;
		actions?: Snippet;
		children?: Snippet;
	} = $props();
</script>

<div class={`primitive-page ${className}`}>
	<header>
		<div class="page-head-inner">
			<div class="page-copy">
				<h1>{title}</h1>
				{#if lead}<p>{lead}</p>{/if}
			</div>
			{#if actions}<div class="page-actions">{@render actions()}</div>{/if}
		</div>
	</header>
	<div class:wide class="page-body">{@render children?.()}</div>
</div>

<style>
	.primitive-page { display: flex; width: 100%; min-height: 100%; flex-direction: column; background: var(--color-paper); color: var(--color-ink); }
	header { flex: 0 0 auto; border-bottom: 1px solid color-mix(in srgb, var(--color-line) 80%, transparent); background: color-mix(in srgb, var(--color-paper) 92%, var(--color-elevate)); }
	.page-head-inner { display: flex; min-height: 42px; align-items: center; justify-content: space-between; gap: 10px; padding: 7px 16px; }
	.page-copy { display: flex; min-width: 0; flex-direction: column; gap: 1px; }
	h1 { margin: 0; color: var(--color-ink); font-size: 13.5px; font-weight: 600; letter-spacing: -.01em; line-height: 1.2; }
	p { margin: 0; color: var(--color-muted); font-size: 11.5px; line-height: 1.3; }
	.page-actions { display: flex; flex: 0 0 auto; align-items: center; gap: 6px; }
	.page-body { display: flex; width: min(840px,100%); min-height: 0; flex: 1; flex-direction: column; margin: 0 auto; padding: 28px 20px 48px; }
	.page-body.wide { width: min(1040px,100%); padding: 24px 32px 48px; }
	@media (max-width: 560px) { .page-head-inner { padding: 7px 12px; } .page-copy p { display: none; } .page-body, .page-body.wide { padding: 20px 14px 40px; } }
</style>
