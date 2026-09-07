<script lang="ts">
	import Spinner from './Spinner.svelte';

	let { checked = $bindable(false), disabled = false, pending = false, onCheckedChange, label, type = 'button' }: {
		checked?: boolean;
		disabled?: boolean;
		/** Write in flight: the thumb becomes a spinner and further clicks are ignored. */
		pending?: boolean;
		onCheckedChange?: (checked: boolean) => void;
		label?: string;
		type?: 'button' | 'submit';
	} = $props();

	const inert = $derived(disabled || pending);

	function toggle(): void {
		if (inert) return;
		checked = !checked;
		onCheckedChange?.(checked);
	}
</script>

<button
	{type}
	role="switch"
	aria-checked={checked}
	aria-label={label}
	aria-busy={pending || undefined}
	disabled={inert}
	data-checked={checked ? '' : undefined}
	onclick={toggle}
>
	{#if pending}
		<span class="thumb busy" data-checked={checked ? '' : undefined}><Spinner size={11} /></span>
	{:else}
		<span class="thumb" data-checked={checked ? '' : undefined}></span>
	{/if}
</button>

<style>
	button { display: inline-flex; width: 36px; height: 20px; flex: 0 0 auto; align-items: center; border: 1px solid var(--color-line); border-radius: 999px; outline: none; background: var(--color-paper); padding: 2px; cursor: pointer; transition: background 150ms, border-color 150ms; }
	button[data-checked] { border-color: var(--color-accent); background: var(--color-accent); }
	button:disabled { cursor: default; opacity: .4; }
	/* Pending is in-flight, not unavailable — don't fade it to the disabled 0.4. */
	button[aria-busy='true']:disabled { cursor: progress; opacity: 1; }
	.thumb { width: 14px; height: 14px; border-radius: 999px; background: var(--color-ink); transition: transform 150ms, background 150ms; }
	.thumb[data-checked] { transform: translateX(16px); background: var(--color-paper); }
	.thumb.busy { display: grid; place-items: center; background: transparent; }
	.thumb.busy { color: var(--color-ink); }
	.thumb.busy[data-checked] { color: var(--color-paper); }
</style>
