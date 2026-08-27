<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		title,
		subtitle,
		/** Right-hand side of the heading row: a count Badge, a Select, a Button. */
		actions,
		/** Body padding, for prose panels. List panels manage their own row padding. */
		padded = false,
		class: className = '',
		children
	}: {
		title?: string;
		subtitle?: string;
		actions?: Snippet;
		padded?: boolean;
		class?: string;
		children?: Snippet;
	} = $props();

	const showHeading = $derived(Boolean(title) || Boolean(actions));
</script>

<section class={`panel ${className}`}>
	{#if showHeading}
		<div class="panel-heading">
			<div class="panel-heading-text">
				{#if title}<h2 class="panel-title">{title}</h2>{/if}
				{#if subtitle}<p class="panel-subtitle">{subtitle}</p>{/if}
			</div>
			{#if actions}<div class="panel-actions">{@render actions()}</div>{/if}
		</div>
	{/if}
	<div class:padded class="panel-body">{@render children?.()}</div>
</section>

<style>
	.panel-heading-text { min-width: 0; }
	.panel-actions { display: flex; flex: 0 0 auto; align-items: center; gap: 8px; }
	.panel-body { min-width: 0; }
	.panel-body.padded { padding: 13px 18px; }
</style>
