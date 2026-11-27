<script lang="ts">
	import Button from './Button.svelte';
	let { onClose }: { onClose?: () => void } = $props();
	let divisions = $state(8);
</script>

<div class="grid" aria-hidden="true">{#each Array(divisions - 1) as _, i}<i style:left={`${((i+1)/divisions)*100}%`}></i>{/each}</div>
<div class="debug-panel"><span>grid</span>{#each [4,8,16] as n}<Button size="sm" variant={divisions === n ? 'solid' : 'ghost'} onclick={() => (divisions=n)}>{n}</Button>{/each}<Button size="sm" variant="ghost" aria-label="Close debug grid" onclick={onClose}>×</Button></div>

<style>
	.grid { position: fixed; z-index: 1250; inset: 0; pointer-events: none; }.grid i { position: absolute; top: 0; width: 1px; height: 100%; background: color-mix(in srgb,var(--color-accent) 30%,transparent); }
	.debug-panel { position: fixed; z-index: 1251; top: 16px; right: 16px; display: flex; align-items: center; gap: 8px; border: 1px solid var(--color-line); border-radius: 10px; background: var(--color-paper); padding: 8px; box-shadow: 0 2px 8px rgba(15,15,20,.08); }.debug-panel > span { color: var(--color-muted); font-family: var(--font-mono); font-size: 12px; }
</style>
