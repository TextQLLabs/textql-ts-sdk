<script lang="ts">
	import { Check } from '@lucide/svelte';

	let {
		checked = $bindable(false),
		name,
		disabled = false,
		label,
		description
	}: {
		checked?: boolean;
		/** Set to submit the box with a form; the native input carries the value. */
		name?: string;
		disabled?: boolean;
		label: string;
		description?: string;
	} = $props();
</script>

<label class="checkbox" class:disabled>
	<input type="checkbox" {name} {disabled} bind:checked />
	<span class="box" aria-hidden="true">{#if checked}<Check size={10} strokeWidth={3} />{/if}</span>
	<span class="copy">
		<span class="label">{label}</span>
		{#if description}<small>{description}</small>{/if}
	</span>
</label>

<style>
	.checkbox { display: inline-flex; align-items: flex-start; gap: 7px; cursor: pointer; }
	.checkbox.disabled { cursor: not-allowed; opacity: .55; }
	input { position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip-path: inset(50%); }
	.box { display: grid; width: 14px; height: 14px; flex: 0 0 auto; place-items: center; margin-top: 1px; border: 1px solid var(--color-line); border-radius: 4px; background: var(--color-elevate); color: var(--color-paper); transition: background 120ms, border-color 120ms; }
	input:checked + .box { border-color: var(--color-accent); background: var(--color-accent); }
	input:focus-visible + .box { outline: 2px solid var(--color-accent); outline-offset: 2px; }
	.copy { min-width: 0; }
	.label { display: block; color: var(--color-muted); font-size: 10px; }
	small { display: block; margin-top: 2px; color: var(--color-subtle); font-size: 9px; line-height: 1.4; }
</style>
