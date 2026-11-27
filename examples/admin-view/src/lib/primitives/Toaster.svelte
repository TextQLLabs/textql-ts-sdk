<script lang="ts">
	import { CircleAlert, CircleCheck, Info, TriangleAlert, X } from '@lucide/svelte';

	import Button from './Button.svelte';
	import Spinner from './Spinner.svelte';
	import { TOAST_LIMIT, toast, toasts, type ToastItem, type ToastType } from './toast';

	const SWIPE_THRESHOLD = 70;
	const PEEK = 13;
	const GAP = 10;

	const ICONS: Partial<Record<ToastType, typeof Info>> = {
		success: CircleCheck,
		error: CircleAlert,
		warning: TriangleAlert,
		info: Info
	};

	let expanded = $state(false);
	let heights = $state<Record<number, number>>({});
	let swipeId = $state<number | null>(null);
	let swipeX = $state(0);

	// Newest first: index 0 is the frontmost card, matching Base UI's --toast-index.
	const stack = $derived([...$toasts].reverse());
	const visible = $derived(stack.slice(0, TOAST_LIMIT));

	function heightOf(item: ToastItem): number {
		return heights[item.id] ?? 0;
	}

	function offsetY(index: number): number {
		if (!expanded) return index * -PEEK;
		let offset = 0;
		for (let i = 0; i < index; i += 1) offset += heightOf(visible[i]) + GAP;
		return -offset;
	}

	const stackHeight = $derived(
		visible.length === 0
			? 0
			: expanded
				? visible.reduce((total, item) => total + heightOf(item), 0) + GAP * (visible.length - 1)
				: heightOf(visible[0])
	);

	function setExpanded(next: boolean): void {
		expanded = next;
		if (next) toast.pause();
		else toast.resume();
	}

	function startSwipe(event: PointerEvent, id: number): void {
		if (event.button !== 0) return;
		// Skip Close/action: capturing the pointer on those swallows their click.
		if ((event.target as HTMLElement).closest('button')) return;
		(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
		swipeId = id;
		swipeX = 0;
	}

	function moveSwipe(event: PointerEvent, id: number): void {
		if (swipeId !== id) return;
		// Rightward only, matching the viewport's own edge.
		swipeX = Math.max(0, swipeX + event.movementX);
	}

	function endSwipe(id: number): void {
		if (swipeId !== id) return;
		if (swipeX > SWIPE_THRESHOLD) toast.close(id);
		swipeId = null;
		swipeX = 0;
	}
</script>

<section
	class="toaster"
	class:expanded
	aria-label="Notifications"
	style:height={`${stackHeight}px`}
	data-expanded={expanded || undefined}
	onpointerenter={() => setExpanded(true)}
	onpointerleave={() => setExpanded(false)}
	onfocusin={() => setExpanded(true)}
	onfocusout={(event) => {
		if (!event.currentTarget.contains(event.relatedTarget as Node)) setExpanded(false);
	}}
>
	{#each visible as item, index (item.id)}
		{@const Icon = ICONS[item.type]}
		<div
			class="toast"
			data-type={item.type}
			data-swiping={swipeId === item.id || undefined}
			style:--toast-index={index}
			style:--toast-offset-y={`${offsetY(index)}px`}
			style:--toast-swipe-movement-x={`${swipeId === item.id ? swipeX : 0}px`}
			role={item.type === 'error' ? 'alert' : 'status'}
			aria-live={item.type === 'error' ? 'assertive' : 'polite'}
			bind:clientHeight={heights[item.id]}
			onpointerdown={(event) => startSwipe(event, item.id)}
			onpointermove={(event) => moveSwipe(event, item.id)}
			onpointerup={() => endSwipe(item.id)}
			onpointercancel={() => endSwipe(item.id)}
		>
			<div class="toast-content" data-behind={!expanded && index > 0 ? '' : undefined}>
				<span class="toast-icon">
					{#if item.type === 'loading'}
						<Spinner size={15} />
					{:else if Icon}
						<Icon size={15} />
					{/if}
				</span>

				<div class="toast-copy">
					<span class="toast-title">{item.title}</span>
					{#if item.description}<span class="toast-description">{item.description}</span>{/if}
				</div>

				{#if item.actionProps}
					<Button variant="surface" size="xs" class="toast-action" onclick={item.actionProps.onClick}>
						{item.actionProps.children}
					</Button>
				{/if}

				<Button
					variant="ghost"
					size="xs"
					class="toast-close"
					aria-label="Close"
					onclick={() => toast.close(item.id)}
				>
					<X size={13} />
				</Button>
			</div>
		</div>
	{/each}
</section>

<style>
	.toaster {
		position: fixed;
		z-index: 1300;
		right: 16px;
		bottom: 16px;
		width: min(360px, calc(100vw - 32px));
		transition: height 260ms cubic-bezier(.22,1,.36,1);
		pointer-events: none;
	}
	.toaster:empty { display: none; }

	/* Every card is bottom-anchored in the same spot; --toast-index does the layout. */
	.toast {
		position: absolute;
		/* Newest is first in the DOM; invert paint order or the oldest card swallows the pointer. */
		z-index: calc(1000 - var(--toast-index));
		right: 0;
		bottom: 0;
		width: 100%;
		border: 1px solid var(--color-line);
		border-radius: 12px;
		background: var(--color-paper);
		box-shadow: 0 8px 30px -6px rgba(10,10,10,.18);
		transform:
			translateX(var(--toast-swipe-movement-x))
			translateY(var(--toast-offset-y))
			scale(calc(1 - var(--toast-index) * .05));
		transition: transform 260ms cubic-bezier(.22,1,.36,1), opacity 200ms ease;
		pointer-events: auto;
		touch-action: pan-y;
	}
	/* Expanded, the cards are a real column — the depth cue is no longer wanted. */
	.toaster[data-expanded] .toast {
		transform: translateX(var(--toast-swipe-movement-x)) translateY(var(--toast-offset-y));
	}
	/* Follow the finger without easing, or the card lags behind the pointer. */
	.toast[data-swiping] { transition: none; cursor: grabbing; }
	.toast[data-type='success'] .toast-icon { color: var(--color-decision); }
	.toast[data-type='error'] .toast-icon { color: var(--color-danger); }
	.toast[data-type='warning'] .toast-icon { color: var(--color-warning); }
	.toast[data-type='info'] .toast-icon,
	.toast[data-type='loading'] .toast-icon { color: var(--color-access); }

	.toast-content {
		display: grid;
		grid-template-columns: auto minmax(0,1fr) auto auto;
		align-items: start;
		gap: 9px;
		padding: 11px 11px 11px 12px;
		transition: opacity 250ms ease;
	}
	/* Collapsed, only the front card's copy is legible — the rest are just edges. */
	.toast-content[data-behind] { opacity: 0; }

	/* Fixed cell even when empty: a typeless toast would pull its title left and leave the stack ragged. */
	.toast-icon { display: grid; width: 16px; height: 16px; place-items: center; }
	.toast-copy { min-width: 0; }
	.toast-title { display: block; color: var(--color-ink); font-family: var(--font-mono); font-size: 12px; font-weight: 500; }
	.toast-description { display: block; margin-top: 3px; color: var(--color-muted); font-family: var(--font-mono); font-size: 11px; line-height: 1.35; }
	.toast-content :global(.toast-action) { align-self: center; }
	.toast-content :global(.toast-close) { padding: 2px; color: var(--color-muted); }

	@media (prefers-reduced-motion: reduce) {
		.toaster, .toast { transition: none; }
	}
</style>
