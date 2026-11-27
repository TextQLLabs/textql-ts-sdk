<script lang="ts">
	import { Check } from '@lucide/svelte';
	import type { SegmentedOption } from './types';

	let {
		value = $bindable(''),
		options,
		disabled = false,
		/** 'inline' is a compact tab strip; 'cards' stacks label + description. */
		variant = 'inline',
		label,
		onValueChange
	}: {
		value?: string;
		options: SegmentedOption[];
		disabled?: boolean;
		variant?: 'inline' | 'cards';
		label?: string;
		onValueChange?: (value: string) => void;
	} = $props();

	function choose(option: SegmentedOption): void {
		if (disabled || option.disabled || option.value === value) return;
		value = option.value;
		onValueChange?.(value);
	}
</script>

<div class="segmented" data-variant={variant} role="radiogroup" aria-label={label}>
	{#each options as option (option.value)}
		<button
			type="button"
			role="radio"
			aria-checked={option.value === value}
			class:active={option.value === value}
			disabled={disabled || option.disabled}
			onclick={() => choose(option)}
		>
			{#if variant === 'cards'}
				<span class="mark">{#if option.value === value}<Check size={11} />{/if}</span>
			{/if}
			<span class="copy">
				<span class="label">{option.label}</span>
				{#if option.description}<small>{option.description}</small>{/if}
			</span>
			{#if option.count !== undefined}<span class="count">{option.count}</span>{/if}
		</button>
	{/each}
</div>

<style>
	.segmented { display: flex; min-width: 0; }
	.segmented button { display: flex; align-items: center; gap: 7px; border: 1px solid transparent; background: transparent; color: var(--color-muted); cursor: pointer; }
	.segmented button:disabled { cursor: not-allowed; opacity: .5; }
	.label { display: block; }
	small { display: block; margin-top: 2px; color: var(--color-subtle); font-size: 9px; line-height: 1.4; }

	.segmented[data-variant='inline'] { gap: 2px; border: 1px solid var(--color-line); border-radius: 8px; background: var(--color-fill); padding: 2px; }
	.segmented[data-variant='inline'] button { border-radius: 6px; padding: 4px 10px; font-size: 11px; }
	.segmented[data-variant='inline'] button:hover:not(:disabled) { color: var(--color-ink); }
	.segmented[data-variant='inline'] button.active { background: var(--color-elevate); color: var(--color-ink); box-shadow: 0 1px 2px rgba(10,10,10,.06); }
	.segmented[data-variant='inline'] .count { color: var(--color-subtle); font-family: var(--font-mono); font-size: 9px; }

	.segmented[data-variant='cards'] { flex-direction: column; gap: 6px; }
	.segmented[data-variant='cards'] button { align-items: flex-start; border-color: var(--color-line); border-radius: 8px; background: var(--color-elevate); padding: 8px 10px; text-align: left; }
	.segmented[data-variant='cards'] button.active { border-color: color-mix(in srgb, var(--color-accent) 55%, transparent); background: var(--color-access-soft); }
	.segmented[data-variant='cards'] .mark { display: grid; width: 15px; height: 15px; flex: 0 0 auto; place-items: center; margin-top: 1px; border: 1px solid var(--color-line); border-radius: 999px; background: var(--color-elevate); color: var(--color-accent); }
	.segmented[data-variant='cards'] button.active .mark { border-color: var(--color-accent); }
	.segmented[data-variant='cards'] .label { color: var(--color-ink); font-size: 11px; font-weight: 600; }
	.segmented[data-variant='cards'] .copy { min-width: 0; flex: 1; }
</style>
