import { Search, X } from 'lucide-react';
import { useEffect, useMemo, useRef } from 'react';

import { cx } from '../../lib/cx';
import { SINCE_PREFIX, type ColumnFilter } from '../../lib/tableFilter';
import type { SortEntry } from '../../lib/tableSort';
import { UnicodeSpinner } from '../UnicodeSpinner';
import { FilterPopover } from './FilterPopover';
import { loadToolbarState, saveToolbarState } from './persist';
import {
	CHIP,
	CHIP_CLEAR,
	CHIP_LABEL,
	SEARCH_INPUT,
	SEARCH_WRAP,
	TAB,
	TAB_COUNT,
	TAB_IDLE,
	TAB_ON
} from './styles';
import { toOption, type FilterField, type FilterTab } from './types';

type Props = {
	fields: FilterField[];
	/**
	 * Rows facet options are derived from when a field declares none. Leave
	 * empty on server-filtered surfaces and declare `filterOptions` instead.
	 */
	items?: unknown[];
	search: string;
	onSearchChange: (value: string) => void;
	filters: ColumnFilter[];
	onFiltersChange: (filters: ColumnFilter[]) => void;
	sortEntries: SortEntry[];
	onSortChange: (entries: SortEntry[]) => void;
	tabs?: FilterTab[];
	activeTab?: string;
	onTabChange?: (id: string) => void;
	/**
	 * localStorage key for filters/sort/tab. Skip it on surfaces whose store
	 * already persists its own sort — two sources of truth drift.
	 */
	persistKey?: string;
	placeholder?: string;
	/** Server-side search in flight — shows a spinner inside the input. */
	searching?: boolean;
	/** Drop the text search — for surfaces with nothing to search over. */
	showSearch?: boolean;
	datePresets?: { value: string; label: string }[];
};

/** Stable identity for server-filtered surfaces, which derive no facet options from rows. */
const NO_ITEMS: unknown[] = [];

export function FilterToolbar({
	fields,
	items = NO_ITEMS,
	search,
	onSearchChange,
	filters,
	onFiltersChange,
	sortEntries,
	onSortChange,
	tabs,
	activeTab = '',
	onTabChange,
	persistKey,
	placeholder = 'Search…',
	searching = false,
	showSearch = true,
	datePresets = []
}: Props) {
	const restored = useRef(false);

	useEffect(() => {
		if (restored.current || !persistKey) return;
		restored.current = true;
		const saved = loadToolbarState(persistKey);
		if (saved.tab && (!tabs || tabs.some((tab) => tab.id === saved.tab))) onTabChange?.(saved.tab);
		if (saved.filters) onFiltersChange(saved.filters);
		if (saved.sort) onSortChange(saved.sort);
		// Restore runs once per key; re-running on every prop change would fight
		// the very state it just wrote.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [persistKey]);

	useEffect(() => {
		if (!persistKey || !restored.current) return;
		saveToolbarState(persistKey, { tab: activeTab, filters, sort: sortEntries });
	}, [persistKey, activeTab, filters, sortEntries]);

	const fieldsById = useMemo(() => new Map(fields.map((field) => [field.id, field])), [fields]);

	/** One chip per selected value, flattened across facets. */
	const chips = useMemo(() => {
		const result: { fieldId: string; value: string; label: string }[] = [];
		for (const filter of filters) {
			const field = fieldsById.get(filter.columnId);
			if (!field) continue;
			// A date facet declares no `filterOptions` — its vocabulary is the preset
			// list — so without this its chip would read `Created: month`.
			const options = (
				field.filterKind === 'date' ? datePresets : (field.filterOptions ?? [])
			).map(toOption);
			for (const value of filter.values) {
				const match = options.find((option) => option.value === value);
				const label = match
					? match.label
					: value.startsWith(SINCE_PREFIX)
						? `Since ${value.slice(SINCE_PREFIX.length)}`
						: value;
				result.push({ fieldId: filter.columnId, value, label: `${field.header}: ${label}` });
			}
		}
		return result;
	}, [filters, fieldsById, datePresets]);

	function removeChip(fieldId: string, value: string) {
		onFiltersChange(
			filters
				.map((filter) =>
					filter.columnId === fieldId
						? { ...filter, values: filter.values.filter((v) => v !== value) }
						: filter
				)
				.filter((filter) => filter.values.length > 0)
		);
	}

	// `mb-2`: the page body has no row gap, so the toolbar owns its separation
	// from whatever list sits under it.
	return (
		<div className="mb-2 flex w-full flex-col gap-2">
			<div className="flex items-center gap-2">
				{tabs && tabs.length > 0 && (
					<div className="flex min-w-0 items-center gap-0.5">
						{tabs.map((tab) => (
							<button
								key={tab.id}
								type="button"
								className={cx(TAB, activeTab === tab.id ? TAB_ON : TAB_IDLE)}
								aria-pressed={activeTab === tab.id}
								onClick={() => onTabChange?.(tab.id)}
							>
								{tab.label}
								{tab.count !== undefined && <span className={TAB_COUNT}>{tab.count}</span>}
							</button>
						))}
					</div>
				)}

				{showSearch ? (
					<div className={SEARCH_WRAP}>
						<Search size={14} strokeWidth={2} />
						<input
							className={SEARCH_INPUT}
							type="search"
							placeholder={placeholder}
							aria-label={placeholder}
							value={search}
							onChange={(event) => onSearchChange(event.currentTarget.value)}
						/>
						{searching && <UnicodeSpinner label="Searching" />}
					</div>
				) : (
					<div className="flex-1" />
				)}

				<FilterPopover
					fields={fields}
					items={items}
					datePresets={datePresets}
					filters={filters}
					onFiltersChange={onFiltersChange}
					sortEntries={sortEntries}
					onSortChange={onSortChange}
				/>
			</div>

			{chips.length > 0 && (
				<div className="flex flex-wrap items-center gap-[5px]">
					{chips.map((chip) => (
						<button
							key={`${chip.fieldId}:${chip.value}`}
							type="button"
							className={CHIP}
							title={`Remove ${chip.label}`}
							onClick={() => removeChip(chip.fieldId, chip.value)}
						>
							<span className={CHIP_LABEL}>{chip.label}</span>
							<X size={11} strokeWidth={2.5} />
						</button>
					))}
					<button type="button" className={CHIP_CLEAR} onClick={() => onFiltersChange([])}>
						Clear all
					</button>
				</div>
			)}
		</div>
	);
}
