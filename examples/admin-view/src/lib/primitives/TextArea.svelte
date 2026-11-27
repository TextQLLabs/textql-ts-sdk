<script lang="ts">
	let {
		value = $bindable(''),
		id,
		name,
		rows = 3,
		placeholder,
		disabled = false,
		label,
		class: className = ''
	}: {
		value?: string;
		id?: string;
		name?: string;
		rows?: number;
		placeholder?: string;
		disabled?: boolean;
		label?: string;
		class?: string;
	} = $props();
</script>

<textarea {id} {name} {rows} {placeholder} {disabled} aria-label={label} class={`field-textarea ${className}`} bind:value></textarea>

<style>
	.field-textarea { display: block; width: 100%; resize: vertical; border: 1px solid var(--color-line); border-radius: 7px; background: var(--color-elevate); padding: 7px 9px; color: var(--color-ink); font-size: 12px; line-height: 1.5; }
	.field-textarea:focus { border-color: color-mix(in srgb, var(--color-accent) 55%, transparent); outline: 0; }
	.field-textarea::placeholder { color: var(--color-subtle); }
	.field-textarea:disabled { background: var(--color-fill); cursor: not-allowed; opacity: .7; }
</style>
