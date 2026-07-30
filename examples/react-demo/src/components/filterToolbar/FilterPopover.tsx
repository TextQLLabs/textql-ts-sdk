import { ArrowLeft, Check, ChevronRight, ListFilter, Search } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { cx } from '../../lib/cx';
import { SINCE_PREFIX, distinctValues, type ColumnFilter } from '../../lib/tableFilter';
import { sortDirectionLabel, toggleSortEntry, type SortEntry } from '../../lib/tableSort';
import { DateRangeFilter } from './DateRangeFilter';
import {
	AVATAR,
	BADGE,
	CLEAR,
	FACET_CHECK,
	FACET_CHECK_ON,
	FACET_ROW,
	FACET_ROW_LABEL,
	FACET_ROW_VALUE,
	NOTE,
	PANEL,
	PANEL_SCROLL,
	SEARCH_INPUT,
	SECTION,
	TRIGGER,
	TRIGGER_ACTIVE,
	TRIGGER_IDLE
} from './styles';
import { toOption, type FilterField, type FilterOption } from './types';

const PANEL_W = 264;
const MARGIN = 8;
// Hard cap independent of viewport height — a facet with 60+ options would
// otherwise run the panel floor to ceiling.
const PANEL_MAX_H = 340;

type Props = {
	fields: FilterField[];
	/**
	 * Rows the facet options are derived from when a field declares none.
	 * Server-filtered surfaces pass `[]` and declare `filterOptions` instead —
	 * options taken from one loaded page would be wrong.
	 */
	items: unknown[];
	filters: ColumnFilter[];
	onFiltersChange: (filters: ColumnFilter[]) => void;
	sortEntries: SortEntry[];
	onSortChange: (entries: SortEntry[]) => void;
	datePresets?: { value: string; label: string }[];
};

export function FilterPopover({
	fields,
	items,
	filters,
	onFiltersChange,
	sortEntries,
	onSortChange,
	datePresets = []
}: Props) {
	const [open, setOpen] = useState(false);
	const [activeFieldId, setActiveFieldId] = useState<string | null>(null);
	const [query, setQuery] = useState('');
	const [pos, setPos] = useState({ top: 0, right: 0, maxHeight: 320 });
	const triggerRef = useRef<HTMLButtonElement | null>(null);

	const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

	const optionsFor = useCallback(
		(field: FilterField): FilterOption[] => {
			if (field.filterOptions) return field.filterOptions.map(toOption);
			return distinctValues(items, field).map((value) => ({ value, label: value }));
		},
		[items]
	);

	// A facet with nothing to pick is a dead end, so it doesn't get a row. Date
	// facets carry their own presets and disabled ones are deliberately visible,
	// so neither needs options to earn its place.
	const facetFields = useMemo(
		() =>
			fields.filter((field) => {
				if (!field.filterable) return false;
				if (field.filterDisabled || field.filterKind === 'date') return true;
				return optionsFor(field).length > 0;
			}),
		[fields, optionsFor]
	);
	const sortFields = useMemo(() => fields.filter((field) => field.sortable), [fields]);
	const activeField = facetFields.find((field) => field.id === activeFieldId);

	const activeCount = filters.reduce((total, filter) => total + filter.values.length, 0);

	const valuesFor = (fieldId: string) =>
		filters.find((filter) => filter.columnId === fieldId)?.values ?? [];

	function setValues(fieldId: string, values: string[]) {
		const rest = filters.filter((filter) => filter.columnId !== fieldId);
		onFiltersChange(values.length ? [...rest, { columnId: fieldId, values }] : rest);
	}

	function toggleValue(fieldId: string, value: string) {
		const current = valuesFor(fieldId);
		setValues(
			fieldId,
			current.includes(value) ? current.filter((v) => v !== value) : [...current, value]
		);
	}

	function summaryFor(field: FilterField): string {
		const values = valuesFor(field.id);
		if (values.length === 0) return field.filterAllLabel ?? 'All';
		if (values.length === 1) {
			const match = optionsFor(field).find((option) => option.value === values[0]);
			// A date facet's custom value has no option row to borrow a label from.
			if (!match && values[0].startsWith(SINCE_PREFIX)) {
				return `Since ${values[0].slice(SINCE_PREFIX.length)}`;
			}
			return match?.label ?? values[0];
		}
		return `${values.length} selected`;
	}

	const place = useCallback(() => {
		const rect = triggerRef.current?.getBoundingClientRect();
		if (!rect) return;
		const gap = 4;
		setPos({
			top: rect.bottom + gap,
			// Anchored by the RIGHT edge so a facet that needs a taller or wider
			// box mid-drilldown doesn't shift the panel out from under the cursor.
			right: Math.max(MARGIN, window.innerWidth - rect.right),
			maxHeight: Math.max(
				180,
				Math.min(PANEL_MAX_H, window.innerHeight - rect.bottom - gap - MARGIN)
			)
		});
	}, []);

	const closePanel = useCallback(() => {
		setOpen(false);
		setActiveFieldId(null);
		setQuery('');
	}, []);

	function toggleOpen() {
		if (open) {
			closePanel();
			return;
		}
		setActiveFieldId(null);
		setQuery('');
		place();
		setOpen(true);
	}

	useEffect(() => {
		if (!open) return;

		function onKeydown(event: KeyboardEvent) {
			if (event.key !== 'Escape') return;
			setActiveFieldId((current) => {
				if (current) return null;
				closePanel();
				return null;
			});
		}
		function onPointerDown(event: PointerEvent) {
			const target = event.target;
			if (!(target instanceof Element) || !target.closest('[data-filter-popover]')) {
				closePanel();
			}
		}
		window.addEventListener('keydown', onKeydown);
		window.addEventListener('pointerdown', onPointerDown);
		return () => {
			window.removeEventListener('keydown', onKeydown);
			window.removeEventListener('pointerdown', onPointerDown);
		};
	}, [open, closePanel]);

	// The panel is `position: fixed` against the rect measured on open, so
	// anything that moves the trigger afterwards strands it. Capture phase so a
	// scrolling ancestor counts too — which also means this fires for scrolls
	// inside the panel's own option list, so coalesce to one measure per frame.
	useEffect(() => {
		if (!open) return;
		let frame = 0;
		const remeasure = () => {
			if (frame) return;
			frame = requestAnimationFrame(() => {
				frame = 0;
				place();
			});
		};
		window.addEventListener('scroll', remeasure, true);
		window.addEventListener('resize', remeasure);
		return () => {
			if (frame) cancelAnimationFrame(frame);
			window.removeEventListener('scroll', remeasure, true);
			window.removeEventListener('resize', remeasure);
		};
	}, [open, place]);

	const allOptions = activeField ? optionsFor(activeField) : [];
	const q = query.trim().toLowerCase();
	const visibleOptions = q
		? allOptions.filter((option) => option.label.toLowerCase().includes(q))
		: allOptions;

	return (
		<div className="relative shrink-0" data-filter-popover>
			<button
				ref={triggerRef}
				type="button"
				className={cx(TRIGGER, activeCount > 0 ? TRIGGER_ACTIVE : TRIGGER_IDLE)}
				aria-haspopup="menu"
				aria-expanded={open}
				onClick={toggleOpen}
			>
				<ListFilter size={14} strokeWidth={2} />
				<span>Filter</span>
				{activeCount > 0 && <span className={BADGE}>{activeCount}</span>}
			</button>

			{open && (
				<div
					className={PANEL}
					role="menu"
					tabIndex={-1}
					style={{
						top: pos.top,
						right: pos.right,
						width: PANEL_W,
						maxHeight: pos.maxHeight
					}}
				>
					{!activeField ? (
						<>
							<div className={PANEL_SCROLL}>
							{facetFields.map((field) => (
								<button
									key={field.id}
									type="button"
									className={FACET_ROW}
									disabled={field.filterDisabled}
									onClick={() => {
										setActiveFieldId(field.id);
										setQuery('');
										place();
									}}
								>
									<span className={FACET_ROW_LABEL}>{field.header}</span>
									<span className={FACET_ROW_VALUE}>{summaryFor(field)}</span>
									<ChevronRight size={13} strokeWidth={2} />
								</button>
							))}

							{sortFields.length > 0 && (
								<>
									<div className={SECTION}>Sort</div>
									{sortFields.map((field) => {
										const entry = sortEntries.find((s) => s.columnId === field.id);
										return (
											<button
												key={field.id}
												type="button"
												className={FACET_ROW}
												onClick={() =>
													onSortChange(toggleSortEntry(sortEntries, field.id, field))
												}
											>
												<span className={FACET_ROW_LABEL}>{field.header}</span>
												{entry && (
													<>
														<span className={FACET_ROW_VALUE}>
															{sortDirectionLabel(field, entry.dir)}
														</span>
														<Check size={13} strokeWidth={2.5} />
													</>
												)}
											</button>
										);
									})}
								</>
							)}
							</div>

							{activeCount > 0 && (
								<div className="mt-0.5 flex justify-end border-t border-line/55 pt-1">
									<button type="button" className={CLEAR} onClick={() => onFiltersChange([])}>
										Clear all
									</button>
								</div>
							)}
						</>
					) : (
						<>
							<div className="flex items-center gap-1.5 px-1 pt-0.5 pb-1.5">
								<button
									type="button"
									className="inline-flex size-[22px] items-center justify-center rounded-[5px] border-0 bg-transparent text-muted hover:bg-elevate/70 hover:text-ink"
									aria-label="Back to filters"
									onClick={() => setActiveFieldId(null)}
								>
									<ArrowLeft size={13} strokeWidth={2} />
								</button>
								<span className="flex-1 text-xs font-semibold text-ink">
									{activeField.header}
								</span>
								{valuesFor(activeField.id).length > 0 && (
									<button
										type="button"
										className={CLEAR}
										onClick={() => setValues(activeField.id, [])}
									>
										Clear
									</button>
								)}
							</div>

							{activeField.filterNote && <p className={NOTE}>{activeField.filterNote}</p>}

							{activeField.filterKind === 'date' ? (
								(() => {
									const value = valuesFor(activeField.id)[0];
									return (
										<DateRangeFilter
											presets={datePresets}
											isAllTime={value === undefined}
											isPresetSelected={(preset) => value === preset}
											onSelectAllTime={() => setValues(activeField.id, [])}
											onSelectPreset={(preset) =>
												setValues(activeField.id, value === preset ? [] : [preset])
											}
											sinceValue={
												value?.startsWith(SINCE_PREFIX)
													? value.slice(SINCE_PREFIX.length)
													: undefined
											}
											maxValue={today}
											onSelectSince={(date) =>
												setValues(activeField.id, date ? [`${SINCE_PREFIX}${date}`] : [])
											}
										/>
									);
								})()
							) : (
								<>
									{allOptions.length > 8 && (
										<div className="flex items-center gap-1.5 px-2 pt-0.5 pb-1.5 text-muted">
											<Search size={13} strokeWidth={2} />
											<input
												className={SEARCH_INPUT}
												type="search"
												placeholder={`Search ${activeField.header.toLowerCase()}…`}
												value={query}
												onChange={(event) => setQuery(event.currentTarget.value)}
											/>
										</div>
									)}

									<div className={PANEL_SCROLL}>
										{visibleOptions.length === 0 ? (
											<p className={NOTE}>No matches.</p>
										) : (
											visibleOptions.map((option) => {
												const on = valuesFor(activeField.id).includes(option.value);
												const Icon = option.icon;
												return (
													<button
														key={option.value}
														type="button"
														className={FACET_ROW}
														onClick={() => toggleValue(activeField.id, option.value)}
													>
														<span className={on ? FACET_CHECK_ON : FACET_CHECK}>
															{on && <Check size={11} strokeWidth={3} />}
														</span>
														{activeField.filterKind === 'people' ? (
															option.imageUrl ? (
																<img
																	className={AVATAR}
																	src={option.imageUrl}
																	alt=""
																	loading="lazy"
																/>
															) : (
																<span className={AVATAR}>
																	{option.label.trim().charAt(0).toUpperCase() || '?'}
																</span>
															)
														) : (
															Icon && <Icon size={13} strokeWidth={2} />
														)}
														<span className={FACET_ROW_LABEL}>{option.label}</span>
													</button>
												);
											})
										)}
									</div>
								</>
							)}
						</>
					)}
				</div>
			)}
		</div>
	);
}
