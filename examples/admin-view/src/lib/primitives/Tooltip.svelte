<script lang="ts">
	import type { Snippet } from 'svelte';
	let { label, shortcut, side = 'bottom', children }: { label: string; shortcut?: string; side?: 'top'|'bottom'|'left'|'right'; children?: Snippet } = $props();
	let root: HTMLSpanElement;
	let open = $state(false);
	let point = $state({ x: 0, y: 0 });
	let timer: ReturnType<typeof setTimeout>;
	function show(): void {
		const box = (root.firstElementChild ?? root).getBoundingClientRect();
		point = side === 'bottom' ? { x: box.left + box.width/2, y: box.bottom + 6 } : side === 'top' ? { x: box.left + box.width/2, y: box.top - 6 } : side === 'right' ? { x: box.right + 6, y: box.top + box.height/2 } : { x: box.left - 6, y: box.top + box.height/2 };
		clearTimeout(timer); timer = setTimeout(() => (open = true), 300);
	}
	function hide(): void { clearTimeout(timer); open = false; }
</script>

<span class="tooltip-trigger" role="presentation" bind:this={root} onpointerenter={show} onpointerleave={hide} onfocusin={show} onfocusout={hide}>{@render children?.()}</span>
{#if open}<span class="tooltip" data-side={side} role="tooltip" style:left={`${point.x}px`} style:top={`${point.y}px`}>{label}{#if shortcut}<kbd>{shortcut}</kbd>{/if}</span>{/if}

<style>
	.tooltip-trigger { display: inline-flex; }
	.tooltip { position: fixed; z-index: 1200; display: inline-flex; align-items: center; gap: 6px; border-radius: 6px; background: var(--color-ink); padding: 4px 7px; color: var(--color-paper); font-size: 11.5px; line-height: 1.2; white-space: nowrap; pointer-events: none; box-shadow: 0 4px 12px rgba(0,0,0,.16); animation: reveal 160ms ease; }
	.tooltip[data-side='bottom'] { transform: translateX(-50%); }.tooltip[data-side='top'] { transform: translate(-50%,-100%); }.tooltip[data-side='right'] { transform: translateY(-50%); }.tooltip[data-side='left'] { transform: translate(-100%,-50%); }
	kbd { border-radius: 4px; background: rgba(247,247,248,.22); padding: 0 4px; font: inherit; font-size: 10.5px; }
	@keyframes reveal { from { opacity: 0; } }
</style>
