<script lang="ts">
	import type { Component, Snippet } from 'svelte';

	let {
		icon,
		title,
		description,
		/** 'inline' fills a panel body; 'page' is the tall centred variant. */
		size = 'inline',
		children
	}: {
		icon?: Component<{ size?: number | string }>;
		title: string;
		description?: string;
		size?: 'inline' | 'page';
		children?: Snippet;
	} = $props();

	const Icon = $derived(icon);
</script>

<div class="empty" data-size={size}>
	{#if Icon}<div class="empty-icon"><Icon size={size === 'page' ? 20 : 17} /></div>{/if}
	<strong>{title}</strong>
	{#if description}<p>{description}</p>{/if}
	{#if children}<div class="empty-extra">{@render children()}</div>{/if}
</div>

<style>
	.empty { display: grid; justify-items: center; text-align: center; }
	.empty[data-size='inline'] { padding: 30px 20px; }
	.empty[data-size='page'] { min-height: 260px; align-content: center; padding: 44px 24px; }
	.empty-icon { display: grid; place-items: center; margin-bottom: 10px; border: 1px solid var(--color-line); border-radius: 10px; background: var(--color-fill); color: var(--color-muted); }
	.empty[data-size='inline'] .empty-icon { width: 32px; height: 32px; }
	.empty[data-size='page'] .empty-icon { width: 38px; height: 38px; }
	strong { font-weight: 600; }
	.empty[data-size='inline'] strong { font-size: 12px; }
	.empty[data-size='page'] strong { font-size: 14px; }
	p { max-width: 460px; margin: 6px 0 0; color: var(--color-muted); line-height: 1.5; }
	.empty[data-size='inline'] p { font-size: 10px; }
	.empty[data-size='page'] p { font-size: 12px; }
	.empty-extra { margin-top: 12px; }
</style>
