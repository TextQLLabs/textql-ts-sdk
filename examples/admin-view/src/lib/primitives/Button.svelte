<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { ButtonSize, ButtonVariant } from './types';

	let {
		variant = 'solid',
		size = 'md',
		href,
		disabled = false,
		class: className = '',
		type = 'button',
		children,
		...rest
	}: {
		variant?: ButtonVariant;
		size?: ButtonSize;
		href?: string;
		disabled?: boolean;
		class?: string;
		type?: 'button' | 'submit' | 'reset';
		children?: Snippet;
		[key: string]: unknown;
	} = $props();
</script>

{#if href && !disabled}
	<a {href} class={`primitive-button ${className}`} data-variant={variant} data-size={size} {...rest}>
		{@render children?.()}
	</a>
{:else}
	<button {type} {disabled} class={`primitive-button ${className}`} data-variant={variant} data-size={size} {...rest}>
		{@render children?.()}
	</button>
{/if}

<style>
	.primitive-button { display: inline-flex; align-items: center; justify-content: center; gap: 6px; border: 0; border-radius: 12px; font-family: var(--font-sans); font-weight: 500; line-height: 1.25; text-decoration: none; white-space: nowrap; cursor: pointer; user-select: none; transition: color 120ms ease, background 120ms ease, border-color 120ms ease, box-shadow 120ms ease, opacity 120ms ease; }
	.primitive-button:disabled { cursor: not-allowed; opacity: .5; }
	.primitive-button[data-size='xs'] { padding: 2px 8px; font-size: 10px; }
	.primitive-button[data-size='sm'] { padding: 4px 10px; font-size: 12px; }
	.primitive-button[data-size='md'] { padding: 6px 12px; font-size: 12px; }
	.primitive-button[data-size='lg'] { padding: 8px 16px; font-size: 14px; }
	.primitive-button[data-size='xl'] { padding: 10px 20px; font-size: 16px; }
	.primitive-button[data-variant='solid'] { background: var(--color-accent); color: var(--color-paper); }
	.primitive-button[data-variant='solid']:hover { opacity: .9; }
	.primitive-button[data-variant='classic'] { background: var(--color-accent); color: var(--color-paper); box-shadow: inset 0 1px 0 rgba(255,255,255,.35), 0 2px 4px -1px rgba(10,10,10,.45); }
	.primitive-button[data-variant='classic']:hover { box-shadow: inset 0 1px 0 rgba(255,255,255,.35), 0 3px 6px -1px rgba(10,10,10,.5); }
	.primitive-button[data-variant='classic']:active { transform: translateY(1px); }
	.primitive-button[data-variant='soft'] { background: color-mix(in srgb, var(--color-accent) 10%, transparent); color: var(--color-accent); }
	.primitive-button[data-variant='soft']:hover { background: color-mix(in srgb, var(--color-accent) 20%, transparent); }
	.primitive-button[data-variant='surface'] { border: 1px solid var(--color-line); background: var(--color-paper); color: var(--color-ink); }
	.primitive-button[data-variant='surface']:hover { border-color: var(--color-accent); color: var(--color-accent); }
	.primitive-button[data-variant='outline'] { border: 1px solid var(--color-accent); background: transparent; color: var(--color-accent); }
	.primitive-button[data-variant='outline']:hover { background: color-mix(in srgb, var(--color-accent) 10%, transparent); }
	.primitive-button[data-variant='ghost'] { background: transparent; color: var(--color-muted); }
	.primitive-button[data-variant='ghost']:hover { background: color-mix(in srgb, var(--color-line) 40%, transparent); color: var(--color-accent); }
	.primitive-button[data-variant='danger'] { background: #dc2626; color: var(--color-paper); }
	.primitive-button[data-variant='danger']:hover { background: #b91c1c; }
	.primitive-button[data-variant='danger-soft'] { background: rgba(239,68,68,.1); color: #dc2626; }
	.primitive-button[data-variant='danger-soft']:hover { background: rgba(239,68,68,.2); }
</style>
