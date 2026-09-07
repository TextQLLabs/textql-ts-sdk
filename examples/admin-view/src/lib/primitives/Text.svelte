<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { TextColor, TextSize, TextType } from './types';

	let { text, size = 'md', color = 'black', type = 'paragraph', links = false, class: className = '', children }: {
		text?: string;
		size?: TextSize;
		color?: TextColor;
		type?: TextType;
		links?: boolean;
		class?: string;
		children?: Snippet;
	} = $props();
</script>

<p class={`primitive-text ${className}`} data-size={size} data-color={color} data-type={type} class:text-links={links}>
	{#if text !== undefined}{text}{:else}{@render children?.()}{/if}
</p>

<style>
	p { width: fit-content; margin: 0; line-height: 1.625; }
	p[data-size='xs'] { font-size: 12px; } p[data-size='sm'] { font-size: 14px; } p[data-size='md'] { font-size: 16px; } p[data-size='lg'] { font-size: 18px; } p[data-size='xl'] { font-size: 20px; } p[data-size='2xl'] { font-size: 24px; } p[data-size='3xl'] { font-size: 30px; }
	p[data-color='black'] { color: var(--color-ink); } p[data-color='muted'] { color: var(--color-muted); } p[data-color='white'] { color: var(--color-paper); } p[data-color='accent'] { color: var(--color-accent); }
	p[data-type='paragraph'], p[data-type='label'] { font-family: var(--font-mono); font-weight: 400; }
	p[data-type='label'] { letter-spacing: .08em; text-transform: uppercase; }
	p[data-type='heading'], p[data-type='important'] { font-family: var(--font-pixel); }
	p[data-type='heading'] { letter-spacing: -.025em; }
	.text-links :global(a), .text-links :global(button) { border: 0; background: linear-gradient(var(--color-accent),var(--color-accent)) 0 100% / 0 .075em no-repeat transparent; padding: 0; color: inherit; font: inherit; text-decoration: none; cursor: pointer; transition: background-size .35s cubic-bezier(.22,1,.36,1); }
	.text-links :global(a:hover), .text-links :global(button:hover) { background-size: 100% .075em; }
</style>
