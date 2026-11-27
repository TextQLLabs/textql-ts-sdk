<script lang="ts">
	import type { Snippet } from 'svelte';
	let { open = $bindable(false), title, dismissable = true, onClose, children, actions }: {
		open?: boolean; title?: string; dismissable?: boolean; onClose?: () => void; children?: Snippet; actions?: Snippet;
	} = $props();
	function dismiss(): void { if (!dismissable) return; open = false; onClose?.(); }
	function keydown(event: KeyboardEvent): void { if (open && event.key === 'Escape') dismiss(); }
</script>

<svelte:window onkeydown={keydown} />
{#if open}
	<div class="modal-root" role="dialog" aria-modal="true" aria-label={title}>
		<button class="backdrop" type="button" aria-label="Close" tabindex="-1" onclick={dismiss}></button>
		<div class="dialog">
			{#if title}<h2>{title}</h2>{/if}
			{#if children}<div class="body">{@render children()}</div>{/if}
			{#if actions}<div class="actions">{@render actions()}</div>{/if}
		</div>
	</div>
{/if}

<style>
	.modal-root { position: fixed; z-index: 1100; inset: 0; display: flex; align-items: center; justify-content: center; padding: 16px; }
	.backdrop { position: absolute; inset: 0; border: 0; background: rgba(26,26,28,.4); padding: 0; cursor: default; backdrop-filter: blur(2px); animation: fade 160ms ease; }
	.dialog { position: relative; z-index: 1; width: 100%; max-width: 320px; border: 1px solid var(--color-line); border-radius: 16px; background: var(--color-paper); padding: 12px 16px; box-shadow: 0 20px 60px -12px rgba(15,15,20,.18); animation: reveal 180ms cubic-bezier(.33,1,.68,1); }
	h2 { margin: 0; color: var(--color-ink); font-size: 16px; font-weight: 500; line-height: 1.25; }
	.body { margin-top: 6px; color: var(--color-muted); font-size: 14px; line-height: 1.625; }
	.actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px; }
	@keyframes fade { from { opacity: 0; } }
	@keyframes reveal { from { opacity: 0; transform: translateY(6px) scale(.97); } }
	@media (prefers-reduced-motion: reduce) { .backdrop,.dialog { animation: none; } }
</style>
