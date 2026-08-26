<script lang="ts">
	/** shadcn Base UI select (cn-select-*). Search lives in the popup, not a Combobox, so it disables item-to-trigger alignment. */
	import { Check, ChevronDown, ChevronUp, Search } from '@lucide/svelte';
	import type { Snippet } from 'svelte';
	import type { SelectOption } from './types';

	let {
		value = $bindable(),
		options,
		placeholder = 'Select…',
		disabled = false,
		searchable = false,
		searchPlaceholder = 'Search…',
		size = 'default',
		alignItemWithTrigger = true,
		onValueChange,
		class: className = '',
		id,
		label,
		leading
	}: {
		value: string | number;
		options: SelectOption[];
		placeholder?: string;
		disabled?: boolean;
		searchable?: boolean;
		searchPlaceholder?: string;
		size?: 'sm' | 'default';
		/** Ignored when searchable: a live filter has no stable row to pin. */
		alignItemWithTrigger?: boolean;
		onValueChange?: (value: string | number) => void;
		class?: string;
		id?: string;
		label?: string;
		leading?: Snippet;
	} = $props();

	/** min-w-36 in shadcn; wider here because options carry a description line. */
	const MIN_POPUP_WIDTH = 224;

	let open = $state(false);
	let query = $state('');
	let activeIndex = $state(-1);
	let scrollUp = $state(false);
	let scrollDown = $state(false);
	let root: HTMLDivElement;
	let trigger = $state<HTMLButtonElement>();
	let searchInput = $state<HTMLInputElement>();
	let list = $state<HTMLDivElement>();
	let placement = $state('');
	let side = $state<'top' | 'bottom'>('bottom');

	const selected = $derived(options.find((option) => option.value === value));
	const filtered = $derived(
		options.filter(
			(option) => !query.trim() || option.label.toLowerCase().includes(query.trim().toLowerCase())
		)
	);
	const alignItem = $derived(alignItemWithTrigger && !searchable);

	$effect(() => {
		if (!open || typeof window === 'undefined') return;
		const outside = (event: PointerEvent) => {
			if (event.target instanceof Node && !root.contains(event.target)) close();
		};
		// Ignore scrolls inside the popup; in align mode, re-place() would reset scrollTop.
		const reposition = (event: Event) => {
			if (event.target instanceof Node && root.contains(event.target)) return;
			place();
		};
		window.addEventListener('pointerdown', outside);
		window.addEventListener('resize', place);
		window.addEventListener('scroll', reposition, true);
		return () => {
			window.removeEventListener('pointerdown', outside);
			window.removeEventListener('resize', place);
			window.removeEventListener('scroll', reposition, true);
		};
	});

	$effect(() => {
		if (!open) return;
		place();
		if (searchable) queueMicrotask(() => searchInput?.focus());
	});

	$effect(() => {
		if (!open || activeIndex < 0) return;
		list?.children[activeIndex]?.scrollIntoView({ block: 'nearest' });
	});

	function place(): void {
		if (!trigger) return;
		const rect = trigger.getBoundingClientRect();
		// Right-anchored: a popup wider than the trigger grows inward, not past the panel edge.
		const width = Math.min(
			Math.max(rect.width, MIN_POPUP_WIDTH),
			Math.max(MIN_POPUP_WIDTH, window.innerWidth - 16)
		);
		const left = Math.min(Math.max(8, rect.right - width), window.innerWidth - width - 8);
		const box = `left:${Math.round(left)}px;width:${Math.round(width)}px;`;

		if (alignItem && list) {
			// Selected row sits over the trigger so opening does not move the current value under the cursor.
			const height = Math.min(window.innerHeight - 16, list.scrollHeight);
			const index = options.findIndex((option) => option.value === value);
			const item = list.children[Math.max(0, index)] as HTMLElement | undefined;
			// The popup is the offset parent, so this already counts the list padding.
			const center = item ? item.offsetTop + item.offsetHeight / 2 : 0;
			const triggerCenter = rect.top + rect.height / 2;
			const top = Math.min(Math.max(8, triggerCenter - center), window.innerHeight - height - 8);
			side = 'bottom';
			placement = `${box}max-height:${Math.round(height)}px;top:${Math.round(top)}px;`;
			// Whatever the clamp above took away is made up by scrolling the list.
			list.scrollTop = top + center - triggerCenter;
			updateArrows();
			return;
		}

		const below = window.innerHeight - rect.bottom - 12;
		const above = rect.top - 12;
		const flip = below < Math.min(220, above);
		side = flip ? 'top' : 'bottom';
		placement =
			box +
			`max-height:${Math.round(Math.min(300, flip ? above : below))}px;` +
			(flip
				? `bottom:${Math.round(window.innerHeight - rect.top + 4)}px;`
				: `top:${Math.round(rect.bottom + 4)}px;`);
		updateArrows();
	}

	function updateArrows(): void {
		// Arrows only for the item-aligned popup; on a searchable list they would cover the input.
		if (!list || !alignItem) {
			scrollUp = false;
			scrollDown = false;
			return;
		}
		scrollUp = list.scrollTop > 1;
		scrollDown = list.scrollTop + list.clientHeight < list.scrollHeight - 1;
	}

	/** Hover-scroll, not click. An action so the rAF loop dies when the arrow unmounts.
	 *  pointermove not enter: a still cursor over a newly mounted arrow must not auto-scroll. */
	function arrowScroll(node: HTMLElement, direction: 1 | -1) {
		let frame = 0;
		const stop = () => {
			if (frame) cancelAnimationFrame(frame);
			frame = 0;
		};
		const step = () => {
			if (!list) return stop();
			const from = list.scrollTop;
			list.scrollTop = from + direction * 4;
			updateArrows();
			if (list.scrollTop === from) return stop();
			frame = requestAnimationFrame(step);
		};
		const start = () => {
			if (!frame) frame = requestAnimationFrame(step);
		};
		node.addEventListener('pointermove', start);
		node.addEventListener('pointerleave', stop);
		return {
			destroy() {
				stop();
				node.removeEventListener('pointermove', start);
				node.removeEventListener('pointerleave', stop);
			}
		};
	}

	function show(): void {
		if (disabled) return;
		query = '';
		activeIndex = Math.max(
			0,
			options.findIndex((option) => option.value === value)
		);
		place();
		open = true;
	}

	function close(): void {
		open = false;
		query = '';
		activeIndex = -1;
		scrollUp = false;
		scrollDown = false;
	}

	function choose(option: SelectOption | undefined): void {
		if (!option || option.disabled) return;
		value = option.value;
		onValueChange?.(value);
		close();
	}

	function step(delta: number): void {
		if (!filtered.length) return;
		let next = activeIndex;
		for (let i = 0; i < filtered.length; i += 1) {
			next = (next + delta + filtered.length) % filtered.length;
			if (!filtered[next]?.disabled) break;
		}
		activeIndex = next;
	}

	function keydown(event: KeyboardEvent): void {
		if (!open && ['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
			event.preventDefault();
			show();
			return;
		}
		if (!open) return;
		if (event.key === 'Escape') {
			event.preventDefault();
			close();
		} else if (event.key === 'ArrowDown') {
			event.preventDefault();
			step(1);
		} else if (event.key === 'ArrowUp') {
			event.preventDefault();
			step(-1);
		} else if (event.key === 'Home') {
			event.preventDefault();
			activeIndex = 0;
		} else if (event.key === 'End') {
			event.preventDefault();
			activeIndex = filtered.length - 1;
		} else if (event.key === 'Enter' || (!searchable && event.key === ' ')) {
			event.preventDefault();
			choose(filtered[activeIndex]);
		} else if (event.key === 'Tab') close();
	}
</script>

<div class={`select-root ${className}`} bind:this={root}>
	<button
		bind:this={trigger}
		{id}
		{disabled}
		data-slot="select-trigger"
		data-size={size}
		data-placeholder={selected ? undefined : ''}
		type="button"
		aria-haspopup="listbox"
		aria-expanded={open}
		aria-label={label}
		onclick={() => (open ? close() : show())}
		onkeydown={keydown}
	>
		{#if leading}<span class="leading">{@render leading()}</span>{/if}
		{#if selected?.iconSrc}<img src={selected.iconSrc} alt="" />{/if}
		<span data-slot="select-value">{selected?.label ?? placeholder}</span>
		<ChevronDown size={16} class="select-trigger-icon" />
	</button>

	{#if open}
		<div
			data-slot="select-content"
			data-side={side}
			data-align-trigger={alignItem}
			style={placement}
		>
			{#if searchable}
				<div class="search">
					<Search size={16} />
					<input
						bind:this={searchInput}
						bind:value={query}
						placeholder={searchPlaceholder}
						aria-label={searchPlaceholder}
						onkeydown={keydown}
					/>
				</div>
			{/if}

			{#if scrollUp}
				<span data-slot="select-scroll-up-button" use:arrowScroll={-1}>
					<ChevronUp size={16} />
				</span>
			{/if}

			<div
				data-slot="select-group"
				role="listbox"
				aria-label={label}
				bind:this={list}
				onscroll={updateArrows}
			>
				{#if !filtered.length}<p>No matches.</p>{/if}
				{#each filtered as option, index (option.value)}
					<button
						type="button"
						role="option"
						data-slot="select-item"
						data-highlighted={index === activeIndex ? '' : undefined}
						aria-selected={option.value === value}
						disabled={option.disabled}
						onpointerenter={() => (activeIndex = index)}
						onclick={() => choose(option)}
					>
						{#if option.iconSrc}<img src={option.iconSrc} alt="" />{/if}
						<span data-slot="select-item-text">
							<span class="item-line">
								<strong>{option.label}</strong>
								{#if option.meta}<em>{option.meta}</em>{/if}
							</span>
							{#if option.hint}<small>{option.hint}</small>{/if}
						</span>
						{#if option.value === value}
							<span data-slot="select-item-indicator"><Check size={16} /></span>
						{/if}
					</button>
				{/each}
			</div>

			{#if scrollDown}
				<span data-slot="select-scroll-down-button" use:arrowScroll={1}>
					<ChevronDown size={16} />
				</span>
			{/if}
		</div>
	{/if}
</div>

<style>
	.select-root { position: relative; width: 100%; }

	[data-slot='select-trigger'] {
		display: inline-flex;
		width: 100%;
		align-items: center;
		justify-content: space-between;
		gap: 6px;
		border: 1px solid var(--color-line);
		border-radius: 10px;
		background: transparent;
		padding: 0 8px 0 10px;
		color: var(--color-ink);
		font-size: 13px;
		line-height: 1.4;
		text-align: left;
		white-space: nowrap;
		user-select: none;
		transition: color 120ms, background-color 120ms, border-color 120ms, box-shadow 120ms;
		cursor: pointer;
	}
	[data-slot='select-trigger'][data-size='default'] { height: 32px; }
	[data-slot='select-trigger'][data-size='sm'] { height: 28px; border-radius: 8px; font-size: 12px; }
	[data-slot='select-trigger']:hover:not(:disabled) { background: color-mix(in srgb, var(--color-fill) 60%, transparent); }
	[data-slot='select-trigger']:focus-visible,
	[data-slot='select-trigger'][aria-expanded='true'] {
		border-color: var(--color-accent);
		outline: none;
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-accent) 50%, transparent);
	}
	[data-slot='select-trigger']:disabled { cursor: not-allowed; opacity: .5; }
	[data-slot='select-trigger'][data-placeholder] [data-slot='select-value'] { color: var(--color-muted); }
	[data-slot='select-value'] { min-width: 0; flex: 1; overflow: hidden; text-align: left; text-overflow: ellipsis; }
	.leading { display: inline-flex; flex: 0 0 auto; color: var(--color-muted); }
	:global(.select-trigger-icon) { flex: 0 0 auto; color: var(--color-muted); }

	/* Fixed rather than absolute: callers sit in overflow:hidden panels that would clip the popup. */
	[data-slot='select-content'] {
		position: fixed;
		z-index: 50;
		display: flex;
		min-width: 144px;
		flex-direction: column;
		border-radius: 10px;
		background: var(--color-elevate);
		color: var(--color-ink);
		box-shadow:
			0 0 0 1px color-mix(in srgb, var(--color-ink) 10%, transparent),
			0 4px 6px -1px rgb(0 0 0 / .1),
			0 2px 4px -2px rgb(0 0 0 / .1);
	}
	[data-slot='select-content'][data-align-trigger='false'] {
		animation: select-in 100ms ease-out;
	}
	[data-slot='select-content'][data-side='top'] { transform-origin: bottom; }
	@keyframes select-in {
		from { opacity: 0; transform: scale(.95); }
		to { opacity: 1; transform: scale(1); }
	}

	[data-slot='select-group'] {
		min-height: 0;
		overflow-x: hidden;
		overflow-y: auto;
		overscroll-behavior: contain;
		padding: 4px;
	}

	[data-slot='select-item'] {
		position: relative;
		display: flex;
		width: 100%;
		align-items: center;
		gap: 6px;
		border: 0;
		border-radius: 8px;
		background: transparent;
		padding: 4px 32px 4px 6px;
		color: inherit;
		font-size: 13px;
		line-height: 1.35;
		text-align: left;
		user-select: none;
		cursor: default;
	}
	[data-slot='select-item'][data-highlighted] { background: var(--color-fill); }
	[data-slot='select-item']:disabled { pointer-events: none; opacity: .5; }
	[data-slot='select-item-text'] { min-width: 0; flex: 1; }
	.item-line { display: flex; align-items: baseline; gap: 8px; }
	[data-slot='select-item'] strong,
	[data-slot='select-item'] small { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
	[data-slot='select-item'] strong { min-width: 0; flex: 1; font-weight: 400; }
	[data-slot='select-item'][aria-selected='true'] strong { font-weight: 500; }
	[data-slot='select-item'] em { flex: 0 0 auto; color: var(--color-muted); font-size: 12px; font-style: normal; font-variant-numeric: tabular-nums; }
	[data-slot='select-item'] small { margin-top: 1px; color: var(--color-muted); font-size: 12px; }

	[data-slot='select-item-indicator'] {
		position: absolute;
		top: 50%;
		right: 8px;
		display: flex;
		width: 16px;
		height: 16px;
		align-items: center;
		justify-content: center;
		transform: translateY(-50%);
		pointer-events: none;
	}

	[data-slot='select-scroll-up-button'],
	[data-slot='select-scroll-down-button'] {
		position: absolute;
		z-index: 10;
		display: flex;
		width: 100%;
		align-items: center;
		justify-content: center;
		border-radius: inherit;
		background: var(--color-elevate);
		padding: 4px 0;
		color: var(--color-muted);
		cursor: default;
	}
	[data-slot='select-scroll-up-button'] { top: 0; }
	[data-slot='select-scroll-down-button'] { bottom: 0; }

	.search {
		display: flex;
		align-items: center;
		gap: 6px;
		border-bottom: 1px solid var(--color-line);
		padding: 8px 10px;
		color: var(--color-muted);
	}
	.search input {
		min-width: 0;
		flex: 1;
		border: 0;
		outline: 0;
		background: transparent;
		padding: 0;
		color: var(--color-ink);
		font-size: 13px;
	}
	.search input::placeholder { color: var(--color-muted); }

	img { width: 16px; height: 16px; flex: 0 0 auto; border-radius: 3px; object-fit: contain; }
	[data-slot='select-group'] p { margin: 0; padding: 10px 8px; color: var(--color-muted); font-size: 13px; text-align: center; }
</style>
