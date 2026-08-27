<script lang="ts">
	/** shadcn Calendar slots/modifiers. DayPicker is React-only, so the six-week grid is local. */
	import { ChevronLeft, ChevronRight } from '@lucide/svelte';

	import {
		addDays,
		addMonths,
		compareDay,
		formatMonthYear,
		isBetweenDays,
		isSameDay,
		monthLabels,
		monthWeeks,
		startOfMonth,
		toISODate,
		weekdayLabels
	} from './date';

	let {
		month = $bindable(startOfMonth(new Date())),
		mode = 'single',
		selected,
		from,
		to,
		min,
		max,
		numberOfMonths = 1,
		weekStartsOn = 0,
		showOutsideDays = true,
		captionLayout = 'label',
		onDayClick,
		class: className = ''
	}: {
		month?: Date;
		mode?: 'single' | 'range';
		selected?: Date;
		from?: Date;
		to?: Date;
		min?: Date;
		max?: Date;
		numberOfMonths?: 1 | 2;
		weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
		showOutsideDays?: boolean;
		captionLayout?: 'label' | 'dropdown';
		onDayClick?: (date: Date) => void;
		class?: string;
	} = $props();

	const labels = $derived(weekdayLabels(weekStartsOn));
	const months = monthLabels();
	const years = $derived.by(() => {
		const now = new Date().getFullYear();
		const start = min?.getFullYear() ?? now - 100;
		const end = max?.getFullYear() ?? now + 10;
		return Array.from({ length: end - start + 1 }, (_, index) => start + index);
	});

	const views = $derived(Array.from({ length: numberOfMonths }, (_, index) => addMonths(month, index)));

	let focused = $state<Date | undefined>();

	function isDisabled(date: Date): boolean {
		if (min && compareDay(date, min) < 0) return true;
		if (max && compareDay(date, max) > 0) return true;
		return false;
	}

	function rangeStart(date: Date): boolean {
		return Boolean(from && isSameDay(date, from));
	}

	function rangeEnd(date: Date): boolean {
		return Boolean(to && isSameDay(date, to));
	}

	function rangeMiddle(date: Date): boolean {
		return Boolean(from && to && isBetweenDays(date, from, to));
	}

	function selectedSingle(date: Date): boolean {
		if (mode === 'single') return Boolean(selected && isSameDay(date, selected));
		return Boolean(from && isSameDay(date, from) && (!to || isSameDay(from, to)));
	}

	function canStep(delta: number): boolean {
		const next = addMonths(month, delta);
		if (min && compareDay(addMonths(next, numberOfMonths - 1), startOfMonth(min)) < 0) return false;
		if (max && compareDay(next, startOfMonth(max)) > 0) return false;
		return true;
	}

	function step(delta: number): void {
		if (!canStep(delta)) return;
		month = addMonths(month, delta);
	}

	function pick(date: Date): void {
		if (isDisabled(date)) return;
		onDayClick?.(date);
	}

	function showMonth(next: Date): void {
		month = startOfMonth(next);
		if (focused) focused = new Date(next.getFullYear(), next.getMonth(), focused.getDate());
	}

	function move(delta: number): void {
		const origin = focused ?? selected ?? from ?? new Date();
		const next = addDays(origin, delta);
		if (min && compareDay(next, min) < 0) return;
		if (max && compareDay(next, max) > 0) return;
		focused = next;
		const first = startOfMonth(month);
		const last = addMonths(first, numberOfMonths - 1);
		if (compareDay(startOfMonth(next), first) < 0) month = startOfMonth(next);
		else if (compareDay(startOfMonth(next), last) > 0) month = addMonths(startOfMonth(next), 1 - numberOfMonths);
	}

	function keydown(event: KeyboardEvent): void {
		if (event.target instanceof HTMLSelectElement) return;
		const keys: Record<string, number | 'home' | 'end' | 'pageup' | 'pagedown'> = {
			ArrowLeft: -1,
			ArrowRight: 1,
			ArrowUp: -7,
			ArrowDown: 7,
			Home: 'home',
			End: 'end',
			PageUp: 'pageup',
			PageDown: 'pagedown'
		};
		const action = keys[event.key];
		if (action === undefined) return;
		event.preventDefault();
		if (action === 'pageup') {
			step(-1);
			if (focused) focused = new Date(focused.getFullYear(), focused.getMonth() - 1, focused.getDate());
		} else if (action === 'pagedown') {
			step(1);
			if (focused) focused = new Date(focused.getFullYear(), focused.getMonth() + 1, focused.getDate());
		} else if (action === 'home') {
			const origin = focused ?? new Date();
			move(-((origin.getDay() - weekStartsOn + 7) % 7));
		} else if (action === 'end') {
			const origin = focused ?? new Date();
			move(6 - ((origin.getDay() - weekStartsOn + 7) % 7));
		} else {
			move(action);
		}
	}

	function captionYear(view: Date): number {
		return view.getFullYear();
	}

	function captionMonth(view: Date): number {
		return view.getMonth();
	}

	function setCaption(view: Date, nextMonth: number, nextYear: number): void {
		const index = views.findIndex((item) => item.getTime() === view.getTime());
		showMonth(addMonths(new Date(nextYear, nextMonth, 1), -Math.max(0, index)));
	}

	let root: HTMLDivElement;

	$effect(() => {
		if (!focused || !root) return;
		root.querySelector<HTMLButtonElement>(`button[data-day="${toISODate(focused)}"]`)?.focus();
	});
</script>

<div
	bind:this={root}
	class={`calendar ${className}`}
	data-slot="calendar"
	style="--cell-size: 32px"
>
	<div data-slot="calendar-nav">
		<button
			type="button"
			data-slot="calendar-previous"
			aria-label="Previous month"
			disabled={!canStep(-1)}
			onclick={() => step(-1)}
		>
			<ChevronLeft size={16} />
		</button>
		<button
			type="button"
			data-slot="calendar-next"
			aria-label="Next month"
			disabled={!canStep(1)}
			onclick={() => step(1)}
		>
			<ChevronRight size={16} />
		</button>
	</div>

	<div data-slot="calendar-months" data-count={numberOfMonths}>
		{#each views as view (view.getTime())}
			<section data-slot="calendar-month">
				<div data-slot="calendar-month-caption">
					{#if captionLayout === 'dropdown'}
						<div data-slot="calendar-dropdowns">
							<select
								aria-label="Month"
								value={captionMonth(view)}
								onchange={(event) =>
									setCaption(view, Number((event.currentTarget as HTMLSelectElement).value), captionYear(view))}
							>
								{#each months as label, index}
									<option value={index}>{label}</option>
								{/each}
							</select>
							<select
								aria-label="Year"
								value={captionYear(view)}
								onchange={(event) =>
									setCaption(view, captionMonth(view), Number((event.currentTarget as HTMLSelectElement).value))}
							>
								{#each years as year}
									<option value={year}>{year}</option>
								{/each}
							</select>
						</div>
					{:else}
						<span data-slot="calendar-caption">{formatMonthYear(view)}</span>
					{/if}
				</div>

				<table data-slot="calendar-month-grid" role="grid" aria-label={formatMonthYear(view)} onkeydown={keydown}>
					<thead>
						<tr data-slot="calendar-weekdays">
							{#each labels as label}
								<th data-slot="calendar-weekday" scope="col">{label}</th>
							{/each}
						</tr>
					</thead>
					<tbody>
						{#each monthWeeks(view, weekStartsOn, showOutsideDays) as week}
							<tr data-slot="calendar-week">
								{#each week as cell (toISODate(cell.date))}
									<td
										data-slot="calendar-day"
										role="gridcell"
										aria-selected={selectedSingle(cell.date) || rangeStart(cell.date) || rangeEnd(cell.date) ? true : undefined}
										data-selected={selectedSingle(cell.date) || rangeStart(cell.date) || rangeEnd(cell.date) ? '' : undefined}
										data-range-start={rangeStart(cell.date) ? '' : undefined}
										data-range-end={rangeEnd(cell.date) ? '' : undefined}
										data-range-middle={rangeMiddle(cell.date) ? '' : undefined}
									>
										{#if !cell.hidden}
											<button
												type="button"
												data-day={toISODate(cell.date)}
												data-selected-single={selectedSingle(cell.date) ? '' : undefined}
												data-range-start={rangeStart(cell.date) ? '' : undefined}
												data-range-end={rangeEnd(cell.date) ? '' : undefined}
												data-range-middle={rangeMiddle(cell.date) ? '' : undefined}
												data-today={isSameDay(cell.date, new Date()) ? '' : undefined}
												data-outside={cell.outside ? '' : undefined}
												data-focused={focused && isSameDay(cell.date, focused) ? '' : undefined}
												disabled={isDisabled(cell.date)}
												tabindex={focused
													? isSameDay(cell.date, focused)
														? 0
														: -1
													: isSameDay(cell.date, selected ?? from ?? new Date())
														? 0
														: -1}
												aria-current={isSameDay(cell.date, new Date()) ? 'date' : undefined}
												onclick={() => pick(cell.date)}
											>
												{cell.date.getDate()}
											</button>
										{/if}
									</td>
								{/each}
							</tr>
						{/each}
					</tbody>
				</table>
			</section>
		{/each}
	</div>
</div>

<style>
	.calendar {
		position: relative;
		width: fit-content;
		background: var(--color-elevate);
		color: var(--color-ink);
		user-select: none;
	}

	[data-slot='calendar-months'] { display: flex; gap: 16px; }
	[data-slot='calendar-month'] { display: flex; width: 100%; flex-direction: column; gap: 12px; }

	[data-slot='calendar-nav'] {
		position: absolute;
		inset: 0 0 auto;
		z-index: 1;
		display: flex;
		align-items: center;
		justify-content: space-between;
		pointer-events: none;
	}
	[data-slot='calendar-previous'],
	[data-slot='calendar-next'] {
		display: grid;
		width: var(--cell-size);
		height: var(--cell-size);
		place-items: center;
		border: 0;
		border-radius: 8px;
		background: transparent;
		color: var(--color-muted);
		pointer-events: auto;
		cursor: pointer;
	}
	[data-slot='calendar-previous']:hover:not(:disabled),
	[data-slot='calendar-next']:hover:not(:disabled) { background: var(--color-fill); color: var(--color-ink); }
	[data-slot='calendar-previous']:disabled,
	[data-slot='calendar-next']:disabled { opacity: .4; cursor: default; }

	[data-slot='calendar-month-caption'] {
		display: flex;
		height: var(--cell-size);
		align-items: center;
		justify-content: center;
		padding: 0 var(--cell-size);
	}
	[data-slot='calendar-caption'] { font-size: 13px; font-weight: 500; }

	[data-slot='calendar-dropdowns'] { display: flex; align-items: center; justify-content: center; gap: 6px; }
	[data-slot='calendar-dropdowns'] select {
		border: 1px solid var(--color-line);
		border-radius: 8px;
		background: var(--color-elevate);
		padding: 2px 6px;
		color: var(--color-ink);
		font-size: 12px;
		font-weight: 500;
	}

	[data-slot='calendar-month-grid'] { width: 100%; border-collapse: collapse; }
	[data-slot='calendar-weekday'] {
		width: var(--cell-size);
		padding: 0 0 4px;
		color: var(--color-muted);
		font-size: 11px;
		font-weight: 400;
		text-align: center;
	}

	[data-slot='calendar-day'] { width: var(--cell-size); height: var(--cell-size); padding: 0; text-align: center; }
	[data-slot='calendar-day'][data-range-middle],
	[data-slot='calendar-day'][data-range-start],
	[data-slot='calendar-day'][data-range-end] { background: var(--color-fill); }
	[data-slot='calendar-day'][data-range-start] { border-radius: 8px 0 0 8px; }
	[data-slot='calendar-day'][data-range-end] { border-radius: 0 8px 8px 0; }
	[data-slot='calendar-day'][data-range-start][data-range-end] { border-radius: 8px; background: transparent; }

	[data-slot='calendar-day'] button {
		display: grid;
		width: var(--cell-size);
		height: var(--cell-size);
		place-items: center;
		border: 0;
		border-radius: 8px;
		background: transparent;
		color: inherit;
		font-size: 13px;
		line-height: 1;
		cursor: pointer;
	}
	[data-slot='calendar-day'] button:hover:not(:disabled):not([data-selected-single]):not([data-range-start]):not([data-range-end]) {
		background: var(--color-fill);
	}
	[data-slot='calendar-day'] button[data-today]:not([data-selected-single]):not([data-range-start]):not([data-range-end]) {
		background: var(--color-fill);
	}
	[data-slot='calendar-day'] button[data-outside] { color: var(--color-subtle); }
	[data-slot='calendar-day'] button[data-selected-single],
	[data-slot='calendar-day'] button[data-range-start],
	[data-slot='calendar-day'] button[data-range-end] {
		background: var(--color-accent);
		color: var(--color-paper);
	}
	[data-slot='calendar-day'] button[data-range-middle] { border-radius: 0; color: var(--color-ink); }
	[data-slot='calendar-day'] button:disabled { cursor: default; opacity: .4; }
	[data-slot='calendar-day'] button:focus-visible,
	[data-slot='calendar-day'] button[data-focused] {
		outline: none;
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-accent) 50%, transparent);
	}
</style>
