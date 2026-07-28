import { Check, ChevronDown, Search } from 'lucide-react';
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

import { cx } from '../lib/cx';
import type { SelectOption } from './selectTypes';

type Props<T extends string | number> = {
	/** Selected value. */
	value: T;
	options: SelectOption<T>[];
	placeholder?: string;
	disabled?: boolean;
	/** Show a search box inside the popover to filter options by label. */
	searchable?: boolean;
	searchPlaceholder?: string;
	onValueChange?: (value: T) => void;
	className?: string;
	id?: string;
	'aria-label'?: string;
	/** Optional content rendered before the value inside the trigger. */
	leading?: ReactNode;
};

type Placement = 'bottom' | 'top';

const ICON = 'size-4 shrink-0 rounded-[3px] object-contain';

export function Select<T extends string | number>({
	value,
	options,
	placeholder = 'Select…',
	disabled = false,
	searchable = false,
	searchPlaceholder = 'Search…',
	onValueChange,
	className = '',
	id,
	'aria-label': ariaLabel,
	leading
}: Props<T>) {
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState('');
	const [activeIndex, setActiveIndex] = useState(-1);
	const [pos, setPos] = useState({
		left: 0,
		top: 0,
		width: 0,
		maxHeight: 260,
		placement: 'bottom' as Placement
	});

	const triggerRef = useRef<HTMLButtonElement | null>(null);
	const popoverRef = useRef<HTMLDivElement | null>(null);
	const listRef = useRef<HTMLDivElement | null>(null);
	const searchRef = useRef<HTMLInputElement | null>(null);

	const selected = options.find((option) => option.value === value);
	const q = query.trim().toLowerCase();
	const filteredOptions =
		!searchable || !q ? options : options.filter((option) => option.label.toLowerCase().includes(q));

	const place = useCallback(() => {
		const el = triggerRef.current;
		if (!el) return;
		const rect = el.getBoundingClientRect();
		const margin = 8;
		const gap = 4;
		const spaceBelow = window.innerHeight - rect.bottom - gap - margin;
		const spaceAbove = rect.top - gap - margin;
		// Prefer opening downward unless there's meaningfully more room above.
		const placement: Placement = spaceBelow >= 220 || spaceBelow >= spaceAbove ? 'bottom' : 'top';
		const available = placement === 'bottom' ? spaceBelow : spaceAbove;
		setPos({
			left: rect.left,
			width: rect.width,
			top: placement === 'bottom' ? rect.bottom + gap : rect.top - gap,
			maxHeight: Math.max(140, Math.min(320, available)),
			placement
		});
	}, []);

	function openMenu() {
		if (disabled) return;
		setQuery('');
		place();
		const current = options.findIndex((option) => option.value === value);
		setActiveIndex(current >= 0 ? current : 0);
		setOpen(true);
	}

	const closeMenu = useCallback(() => {
		setOpen(false);
		setActiveIndex(-1);
		setQuery('');
	}, []);

	function toggle() {
		if (open) closeMenu();
		else openMenu();
	}

	function choose(option: SelectOption<T> | undefined) {
		if (!option || option.disabled) return;
		onValueChange?.(option.value);
		closeMenu();
		triggerRef.current?.focus();
	}

	function step(delta: number) {
		const count = filteredOptions.length;
		if (count === 0) return;
		let next = activeIndex < 0 ? (delta > 0 ? -1 : 0) : activeIndex;
		for (let i = 0; i < count; i += 1) {
			next = (next + delta + count) % count;
			if (!filteredOptions[next]?.disabled) break;
		}
		setActiveIndex(next);
	}

	/** Navigation keys shared by the trigger and the search box. */
	function onMenuNavKeydown(event: React.KeyboardEvent): boolean {
		switch (event.key) {
			case 'Escape':
				event.preventDefault();
				closeMenu();
				triggerRef.current?.focus();
				return true;
			case 'ArrowDown':
				event.preventDefault();
				step(1);
				return true;
			case 'ArrowUp':
				event.preventDefault();
				step(-1);
				return true;
			case 'Home':
				event.preventDefault();
				setActiveIndex(0);
				return true;
			case 'End':
				event.preventDefault();
				setActiveIndex(filteredOptions.length - 1);
				return true;
			case 'Enter':
				event.preventDefault();
				choose(filteredOptions[activeIndex]);
				return true;
			case 'Tab':
				closeMenu();
				return true;
		}
		return false;
	}

	function onTriggerKeydown(event: React.KeyboardEvent) {
		if (disabled) return;
		if (!open) {
			if (
				event.key === 'ArrowDown' ||
				event.key === 'ArrowUp' ||
				event.key === 'Enter' ||
				event.key === ' '
			) {
				event.preventDefault();
				openMenu();
			}
			return;
		}
		// When not searchable the trigger keeps focus, so it drives navigation.
		if (event.key === ' ') {
			event.preventDefault();
			choose(filteredOptions[activeIndex]);
			return;
		}
		onMenuNavKeydown(event);
	}

	// Dismiss on any pointer press outside the trigger + popover.
	useEffect(() => {
		if (!open) return;
		const onPointerDown = (event: PointerEvent) => {
			const target = event.target;
			if (
				target instanceof Node &&
				(triggerRef.current?.contains(target) || popoverRef.current?.contains(target))
			) {
				return;
			}
			closeMenu();
		};
		window.addEventListener('pointerdown', onPointerDown);
		return () => window.removeEventListener('pointerdown', onPointerDown);
	}, [open, closeMenu]);

	// Keep the popover glued to the trigger while it's open.
	useEffect(() => {
		if (!open) return;
		const handler = () => place();
		window.addEventListener('scroll', handler, true);
		window.addEventListener('resize', handler);
		return () => {
			window.removeEventListener('scroll', handler, true);
			window.removeEventListener('resize', handler);
		};
	}, [open, place]);

	// Keep the highlighted option in view during keyboard navigation.
	useLayoutEffect(() => {
		if (!open || activeIndex < 0 || !listRef.current) return;
		const el = listRef.current.children[activeIndex];
		if (el instanceof HTMLElement) el.scrollIntoView({ block: 'nearest' });
	}, [open, activeIndex]);

	// Focus the search box as soon as the popover opens.
	useEffect(() => {
		if (open && searchable) searchRef.current?.focus();
	}, [open, searchable]);

	// Keep the highlight valid as the filtered list changes while typing.
	useEffect(() => {
		const count = filteredOptions.length;
		if (activeIndex > count - 1) setActiveIndex(count > 0 ? 0 : -1);
	}, [filteredOptions.length, activeIndex]);

	return (
		<>
			<button
				ref={triggerRef}
				id={id}
				type="button"
				disabled={disabled}
				className={cx(
					'inline-flex w-full cursor-pointer items-center gap-2 rounded-sm border bg-elevate/78 px-[11px] py-[9px] text-left text-[13px] leading-[1.4] text-ink transition-[border-color,background] duration-[120ms] ease-[ease]',
					'hover:not-disabled:bg-elevate/92 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent/55',
					'disabled:cursor-not-allowed disabled:opacity-60',
					open ? 'border-accent/55' : 'border-line/85',
					className
				)}
				aria-haspopup="listbox"
				aria-expanded={open}
				aria-label={ariaLabel}
				onClick={toggle}
				onKeyDown={onTriggerKeydown}
			>
				{leading && <span className="inline-flex shrink-0 items-center text-muted">{leading}</span>}
				{selected?.iconSrc && <img className={ICON} src={selected.iconSrc} alt="" />}
				<span
					className={cx(
						'min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap',
						!selected && 'text-muted'
					)}
				>
					{selected ? selected.label : placeholder}
				</span>
				<ChevronDown
					className={cx(
						'shrink-0 text-muted transition-transform duration-150 ease-[ease] motion-reduce:transition-none',
						open && 'rotate-180'
					)}
					size={15}
					strokeWidth={2}
					aria-hidden="true"
				/>
			</button>

			{open &&
				createPortal(
					<div
						ref={popoverRef}
						className={cx(
							'fixed z-[1000] flex min-h-0 animate-select-in flex-col rounded-sm border border-line/85 bg-[color-mix(in_srgb,var(--color-paper)_96%,var(--color-elevate))] p-1 shadow-[0_12px_32px_rgba(15,15,20,0.12)] motion-reduce:animate-none',
							pos.placement === 'top' ? 'origin-bottom -translate-y-full' : 'origin-top'
						)}
						style={{
							left: `${pos.left}px`,
							top: `${pos.top}px`,
							minWidth: `${pos.width}px`,
							maxHeight: `${pos.maxHeight}px`
						}}
					>
						{searchable && (
							<div className="mb-1 flex shrink-0 items-center gap-1.5 rounded-[7px] bg-line/30 px-2 py-1.5 text-muted">
								<Search size={14} strokeWidth={2} aria-hidden="true" />
								<input
									ref={searchRef}
									className="min-w-0 flex-1 border-0 bg-transparent p-0 text-[13px] text-ink focus:outline-none"
									type="text"
									autoComplete="off"
									spellCheck={false}
									placeholder={searchPlaceholder}
									aria-label={searchPlaceholder}
									value={query}
									onChange={(event) => setQuery(event.target.value)}
									onKeyDown={onMenuNavKeydown}
								/>
							</div>
						)}

						<div
							ref={listRef}
							className="flex min-h-0 flex-col gap-px overflow-y-auto"
							role="listbox"
							aria-label={ariaLabel}
						>
							{filteredOptions.length === 0 ? (
								<p className="m-0 px-2 py-2.5 text-center text-[12.5px] text-muted">No matches.</p>
							) : (
								filteredOptions.map((option, index) => (
									<button
										key={String(option.value)}
										type="button"
										role="option"
										aria-selected={option.value === value}
										className={cx(
											'flex w-full cursor-pointer items-center gap-2 rounded-[7px] border-0 px-2 py-[7px] text-left text-[13px] text-ink disabled:cursor-not-allowed disabled:opacity-50',
											index === activeIndex ? 'bg-accent/12' : 'bg-transparent',
											option.value === value && 'font-medium'
										)}
										disabled={option.disabled}
										onMouseEnter={() => setActiveIndex(index)}
										onClick={() => choose(option)}
									>
										{option.iconSrc && <img className={ICON} src={option.iconSrc} alt="" />}
										<span className="flex min-w-0 flex-1 flex-col gap-px">
											<span className="overflow-hidden text-ellipsis whitespace-nowrap">
												{option.label}
											</span>
											{option.hint && (
												<span className="text-[11.5px] leading-[1.3] text-muted">{option.hint}</span>
											)}
										</span>
										{option.value === value && (
											<span className="inline-flex shrink-0 text-accent" aria-hidden="true">
												<Check size={14} strokeWidth={2.25} />
											</span>
										)}
									</button>
								))
							)}
						</div>
					</div>,
					document.body
				)}
		</>
	);
}
