<script lang="ts">
	import { CheckCircle2, CircleAlert, X } from '@lucide/svelte';
	import { toast, toasts } from './toast';
</script>

<div class="toaster" aria-live="polite">
	{#each $toasts as item (item.id)}
		<div class="toast" data-tone={item.tone}>
			{#if item.tone === 'success'}<CheckCircle2 size={15} />{:else if item.tone === 'error'}<CircleAlert size={15} />{/if}
			<div><strong>{item.title}</strong>{#if item.description}<span>{item.description}</span>{/if}</div>
			<button type="button" aria-label="Dismiss" onclick={() => toast.dismiss(item.id)}><X size={13} /></button>
		</div>
	{/each}
</div>

<style>
	.toaster { position: fixed; z-index: 1300; top: 14px; right: 14px; display: grid; width: min(360px,calc(100vw - 28px)); gap: 8px; pointer-events: none; }
	.toast { display: grid; grid-template-columns: auto minmax(0,1fr) auto; align-items: start; gap: 8px; border: 1px solid var(--color-line); border-radius: 10px; background: var(--color-paper); padding: 10px 11px; color: var(--color-ink); font-family: var(--font-mono); box-shadow: 0 8px 30px -6px rgba(10,10,10,.18); pointer-events: auto; }
	.toast[data-tone='success'] > :global(svg:first-child) { color: var(--color-decision); }.toast[data-tone='error'] > :global(svg:first-child) { color: var(--color-danger); }
	strong, span { display: block; } strong { font-size: 12px; font-weight: 500; } span { margin-top: 3px; color: var(--color-muted); font-size: 11px; line-height: 1.35; }
	button { border: 0; background: transparent; padding: 1px; color: var(--color-muted); cursor: pointer; }
</style>
