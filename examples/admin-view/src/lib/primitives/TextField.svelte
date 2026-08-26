<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { FieldSize } from './types';

	let {
		value = $bindable(''),
		id,
		name,
		type = 'text',
		placeholder,
		disabled = false,
		readonly = false,
		required = false,
		mono = false,
		size = 'md',
		/** Icon rendered inside the field, before the text. */
		leading,
		label,
		class: className = ''
	}: {
		value?: string;
		id?: string;
		name?: string;
		type?: 'text' | 'email' | 'url' | 'search';
		placeholder?: string;
		disabled?: boolean;
		readonly?: boolean;
		required?: boolean;
		mono?: boolean;
		size?: FieldSize;
		leading?: Snippet;
		label?: string;
		class?: string;
	} = $props();
</script>

<div class={`field ${className}`} class:disabled data-size={size}>
	{#if leading}<span class="field-leading">{@render leading()}</span>{/if}
	<input {id} {name} {type} {placeholder} {disabled} {readonly} {required} aria-label={label} class:mono bind:value />
</div>

<style>
	.field { display: flex; width: 100%; min-width: 0; align-items: center; gap: 7px; border: 1px solid var(--color-line); border-radius: 7px; background: var(--color-elevate); color: var(--color-subtle); }
	.field[data-size='sm'] { padding: 4px 8px; }
	.field[data-size='md'] { padding: 7px 9px; }
	.field:focus-within { border-color: color-mix(in srgb, var(--color-accent) 55%, transparent); }
	.field.disabled { background: var(--color-fill); opacity: .7; }
	.field-leading { display: inline-flex; flex: 0 0 auto; }
	input { min-width: 0; flex: 1; border: 0; outline: 0; background: transparent; padding: 0; color: var(--color-ink); }
	.field[data-size='sm'] input { font-size: 11px; }
	.field[data-size='md'] input { font-size: 12px; }
	input.mono { font-family: var(--font-mono); }
	input::placeholder { color: var(--color-subtle); }
	input:disabled { cursor: not-allowed; }
</style>
