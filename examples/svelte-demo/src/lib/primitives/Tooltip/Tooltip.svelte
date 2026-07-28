<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cubicOut } from 'svelte/easing';

	type Side = 'top' | 'bottom' | 'left' | 'right';

	interface Props {
		label: string;
		shortcut?: string;
		side?: Side;
		children: Snippet;
	}

	let { label, shortcut, side = 'bottom', children }: Props = $props();

	const GAP = 6;
	let wrap = $state<HTMLElement>();
	let open = $state(false);
	let x = $state(0);
	let y = $state(0);
	let timer: ReturnType<typeof setTimeout> | undefined;

	function show() {
		const el = wrap?.firstElementChild ?? wrap;
		if (!el) return;
		const r = el.getBoundingClientRect();
		if (side === 'bottom') (x = r.left + r.width / 2), (y = r.bottom + GAP);
		else if (side === 'top') (x = r.left + r.width / 2), (y = r.top - GAP);
		else if (side === 'right') (x = r.right + GAP), (y = r.top + r.height / 2);
		else (x = r.left - GAP), (y = r.top + r.height / 2);
		clearTimeout(timer);
		timer = setTimeout(() => (open = true), 300);
	}
	function hide() {
		clearTimeout(timer);
		open = false;
	}

	// Smooth reveal: fade + a small slide out of the trigger + a touch of scale.
	// Centering lives on the CSS `translate` property so this `transform` is free.
	const SLIDE: Record<Side, [number, number]> = {
		bottom: [0, -5],
		top: [0, 5],
		right: [-5, 0],
		left: [5, 0]
	};
	function reveal(_node: Element, { side }: { side: Side }) {
		const [dx, dy] = SLIDE[side];
		return {
			duration: 160,
			easing: cubicOut,
			css: (t: number, u: number) =>
				`opacity:${t};transform:translate(${dx * u}px,${dy * u}px) scale(${0.97 + 0.03 * t})`
		};
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<span
	class="tooltip-wrap"
	bind:this={wrap}
	onpointerenter={show}
	onpointerleave={hide}
	onfocusin={show}
	onfocusout={hide}
>
	{@render children()}
</span>

{#if open}
	<span
		class="tooltip {side}"
		role="tooltip"
		style="left: {x}px; top: {y}px;"
		transition:reveal={{ side }}
	>
		{label}
		{#if shortcut}<kbd>{shortcut}</kbd>{/if}
	</span>
{/if}

<style>
	.tooltip-wrap {
		display: inline-flex;
	}
	.tooltip {
		position: fixed;
		z-index: 1000;
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		white-space: nowrap;
		pointer-events: none;
		padding: 0.22rem 0.45rem;
		font-size: 11.5px;
		line-height: 1.2;
		color: var(--color-paper);
		background: var(--color-ink);
		border-radius: var(--radius-xs, 6px);
		box-shadow: 0 4px 12px rgb(0 0 0 / 0.16);
		will-change: transform, opacity;
	}
	/* Centering via `translate` (not `transform`) so the reveal transition owns
	   `transform`; the two compose cleanly. */
	.tooltip.bottom {
		translate: -50% 0;
	}
	.tooltip.top {
		translate: -50% -100%;
	}
	.tooltip.right {
		translate: 0 -50%;
	}
	.tooltip.left {
		translate: -100% -50%;
	}
	kbd {
		font: inherit;
		font-size: 10.5px;
		padding: 0.02rem 0.28rem;
		border-radius: 4px;
		background: color-mix(in srgb, var(--color-paper) 22%, transparent);
		color: var(--color-paper);
	}
	@media (prefers-reduced-motion: reduce) {
		.tooltip {
			will-change: auto;
		}
	}
</style>
