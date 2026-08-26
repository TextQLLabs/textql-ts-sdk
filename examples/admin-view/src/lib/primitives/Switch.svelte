<script lang="ts">
	let { checked = $bindable(false), disabled = false, onCheckedChange, label, type = 'button' }: {
		checked?: boolean;
		disabled?: boolean;
		onCheckedChange?: (checked: boolean) => void;
		label?: string;
		type?: 'button' | 'submit';
	} = $props();

	function toggle(): void {
		if (disabled) return;
		checked = !checked;
		onCheckedChange?.(checked);
	}
</script>

<button {type} role="switch" aria-checked={checked} aria-label={label} {disabled} data-checked={checked ? '' : undefined} onclick={toggle}>
	<span data-checked={checked ? '' : undefined}></span>
</button>

<style>
	button { display: inline-flex; width: 36px; height: 20px; flex: 0 0 auto; align-items: center; border: 1px solid var(--color-line); border-radius: 999px; outline: none; background: var(--color-paper); padding: 2px; cursor: pointer; transition: background 150ms, border-color 150ms; }
	button[data-checked] { border-color: var(--color-accent); background: var(--color-accent); }
	button:disabled { cursor: default; opacity: .4; }
	span { width: 14px; height: 14px; border-radius: 999px; background: var(--color-ink); transition: transform 150ms, background 150ms; }
	span[data-checked] { transform: translateX(16px); background: var(--color-paper); }
</style>
