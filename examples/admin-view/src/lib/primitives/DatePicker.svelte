<script lang="ts">
	/** shadcn date-picker composition (Popover + Calendar); there is no DatePicker root.
	 *  Optional presets come from the range-picker example. */
	import { Calendar as CalendarIcon } from '@lucide/svelte';

	import Calendar from './Calendar.svelte';
	import { compareDay, formatDay, isSameDay, startOfMonth, toISODate } from './date';
	import type { DatePreset } from './types';

	let {
		value = $bindable<Date | undefined>(undefined),
		from = $bindable<Date | undefined>(undefined),
		to = $bindable<Date | undefined>(undefined),
		mode = 'single',
		placeholder = 'Pick a date',
		disabled = false,
		size = 'default',
		numberOfMonths = 1,
		captionLayout = 'label',
		min,
		max,
		presets = [],
		onValueChange,
		onRangeChange,
		class: className = '',
		id,
		label,
		name
	}: {
		value?: Date;
		from?: Date;
		to?: Date;
		mode?: 'single' | 'range';
		placeholder?: string;
		disabled?: boolean;
		size?: 'sm' | 'default';
		numberOfMonths?: 1 | 2;
		captionLayout?: 'label' | 'dropdown';
		min?: Date;
		max?: Date;
		presets?: DatePreset[];
		onValueChange?: (value: Date | undefined) => void;
		onRangeChange?: (from: Date | undefined, to: Date | undefined) => void;
		class?: string;
		id?: string;
		label?: string;
		name?: string;
	} = $props();

	let open = $state(false);
	let month = $state(startOfMonth(new Date()));
	let root: HTMLDivElement;
	let trigger = $state<HTMLButtonElement>();
	let popup = $state<HTMLDivElement>();
	let placement = $state('');
	let side = $state<'top' | 'bottom'>('bottom');

	const empty = $derived(mode === 'single' ? !value : !from && !to);

	const display = $derived.by(() => {
		if (mode === 'single') return value ? formatDay(value) : placeholder;
		if (from && to) {
			return isSameDay(from, to) ? formatDay(from) : `${formatDay(from)} – ${formatDay(to)}`;
		}
		if (from) return `${formatDay(from)} – …`;
		return placeholder;
	});

	const activePreset = $derived(
		presets.findIndex((preset) => isSameDay(preset.from, from) && isSameDay(preset.to, to))
	);

	$effect(() => {
		if (!open || typeof window === 'undefined') return;
		const outside = (event: PointerEvent) => {
			if (event.target instanceof Node && !root.contains(event.target)) close();
		};
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
		queueMicrotask(() => {
			const day = popup?.querySelector<HTMLButtonElement>(
				'[data-selected-single], [data-range-start], [data-today], [data-day]'
			);
			day?.focus();
		});
	});

	function place(): void {
		if (!trigger) return;
		const rect = trigger.getBoundingClientRect();
		const width = popup?.offsetWidth ?? 280;
		const height = popup?.offsetHeight ?? 320;
		const left = Math.min(Math.max(8, rect.right - width), Math.max(8, window.innerWidth - width - 8));
		const below = window.innerHeight - rect.bottom - 12;
		const above = rect.top - 12;
		const flip = below < Math.min(height, above) && above > below;
		side = flip ? 'top' : 'bottom';
		placement = `left:${Math.round(left)}px;` +
			(flip
				? `bottom:${Math.round(window.innerHeight - rect.top + 4)}px;`
				: `top:${Math.round(rect.bottom + 4)}px;`);
	}

	function show(): void {
		if (disabled) return;
		const anchor = mode === 'single' ? value : from;
		month = startOfMonth(anchor ?? max ?? new Date());
		place();
		open = true;
	}

	function close(): void {
		open = false;
	}

	function choose(date: Date): void {
		if (mode === 'single') {
			value = date;
			onValueChange?.(date);
			close();
			return;
		}

		if (!from || (from && to)) {
			from = date;
			to = undefined;
		} else if (compareDay(date, from) < 0) {
			to = from;
			from = date;
		} else {
			to = date;
		}
		onRangeChange?.(from, to);
		if (from && to) close();
	}

	function applyPreset(preset: DatePreset): void {
		from = preset.from;
		to = preset.to;
		onRangeChange?.(from, to);
		if (from) month = startOfMonth(from);
		close();
	}

	function keydown(event: KeyboardEvent): void {
		if (!open && ['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
			event.preventDefault();
			show();
		}
	}
</script>

<svelte:window
	onkeydown={(event) => {
		if (open && event.key === 'Escape') {
			event.preventDefault();
			close();
			trigger?.focus();
		}
	}}
/>

<div class={`date-picker ${className}`} bind:this={root}>
	<button
		bind:this={trigger}
		{id}
		{disabled}
		data-slot="date-picker-trigger"
		data-size={size}
		data-empty={empty ? '' : undefined}
		type="button"
		aria-haspopup="dialog"
		aria-expanded={open}
		aria-label={label}
		onclick={() => (open ? close() : show())}
		onkeydown={keydown}
	>
		<CalendarIcon size={16} class="date-picker-icon" />
		<span data-slot="date-picker-value">{display}</span>
	</button>

	{#if name && mode === 'single'}
		<input type="hidden" {name} value={value ? toISODate(value) : ''} />
	{:else if name}
		<input type="hidden" name={`${name}From`} value={from ? toISODate(from) : ''} />
		<input type="hidden" name={`${name}To`} value={to ? toISODate(to) : ''} />
	{/if}

	{#if open}
		<div
			bind:this={popup}
			data-slot="date-picker-content"
			data-side={side}
			role="dialog"
			aria-label={label ?? placeholder}
			style={placement}
		>
			{#if presets.length}
				<div data-slot="date-picker-presets">
					{#each presets as preset, index (preset.label)}
						<button
							type="button"
							data-active={index === activePreset ? '' : undefined}
							onclick={() => applyPreset(preset)}
						>
							{preset.label}
						</button>
					{/each}
				</div>
			{/if}
			<Calendar
				bind:month
				{mode}
				selected={value}
				{from}
				{to}
				{min}
				{max}
				{numberOfMonths}
				{captionLayout}
				onDayClick={choose}
			/>
		</div>
	{/if}
</div>

<style>
	.date-picker { position: relative; width: 100%; }

	[data-slot='date-picker-trigger'] {
		display: inline-flex;
		width: 100%;
		align-items: center;
		justify-content: flex-start;
		gap: 8px;
		border: 1px solid var(--color-line);
		border-radius: 10px;
		background: transparent;
		padding: 0 10px;
		color: var(--color-ink);
		font-size: 13px;
		line-height: 1.4;
		text-align: left;
		white-space: nowrap;
		user-select: none;
		transition: color 120ms, background-color 120ms, border-color 120ms, box-shadow 120ms;
		cursor: pointer;
	}
	[data-slot='date-picker-trigger'][data-size='default'] { height: 32px; }
	[data-slot='date-picker-trigger'][data-size='sm'] { height: 28px; border-radius: 8px; font-size: 12px; }
	[data-slot='date-picker-trigger']:hover:not(:disabled) { background: color-mix(in srgb, var(--color-fill) 60%, transparent); }
	[data-slot='date-picker-trigger']:focus-visible,
	[data-slot='date-picker-trigger'][aria-expanded='true'] {
		border-color: var(--color-accent);
		outline: none;
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-accent) 50%, transparent);
	}
	[data-slot='date-picker-trigger']:disabled { cursor: not-allowed; opacity: .5; }
	[data-slot='date-picker-trigger'][data-empty] [data-slot='date-picker-value'] { color: var(--color-muted); }
	[data-slot='date-picker-value'] { min-width: 0; flex: 1; overflow: hidden; text-overflow: ellipsis; }
	:global(.date-picker-icon) { flex: 0 0 auto; color: var(--color-muted); }

	[data-slot='date-picker-content'] {
		position: fixed;
		z-index: 50;
		display: flex;
		gap: 8px;
		border-radius: 10px;
		background: var(--color-elevate);
		color: var(--color-ink);
		padding: 10px;
		box-shadow:
			0 0 0 1px color-mix(in srgb, var(--color-ink) 10%, transparent),
			0 4px 6px -1px rgb(0 0 0 / .1),
			0 2px 4px -2px rgb(0 0 0 / .1);
		animation: date-picker-in 100ms ease-out;
	}
	[data-slot='date-picker-content'][data-side='top'] { transform-origin: bottom; }
	@keyframes date-picker-in {
		from { opacity: 0; transform: scale(.95); }
		to { opacity: 1; transform: scale(1); }
	}

	[data-slot='date-picker-presets'] {
		display: flex;
		min-width: 108px;
		flex-direction: column;
		gap: 2px;
		padding: 2px 4px 2px 0;
	}
	[data-slot='date-picker-presets'] button {
		border: 0;
		border-radius: 8px;
		background: transparent;
		padding: 6px 8px;
		color: var(--color-muted);
		font-size: 12px;
		text-align: left;
		cursor: pointer;
	}
	[data-slot='date-picker-presets'] button:hover { background: var(--color-fill); color: var(--color-ink); }
	[data-slot='date-picker-presets'] button[data-active] {
		background: var(--color-fill);
		color: var(--color-ink);
		font-weight: 500;
	}

	@media (max-width: 560px) {
		[data-slot='date-picker-content'] { flex-direction: column; }
		[data-slot='date-picker-presets'] {
			min-width: 0;
			flex-direction: row;
			flex-wrap: wrap;
			padding: 0 0 4px;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		[data-slot='date-picker-content'] { animation: none; }
	}
</style>
