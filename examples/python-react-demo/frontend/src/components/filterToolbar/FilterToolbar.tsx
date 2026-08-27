import { Search, X } from 'lucide-react';
import { useMemo } from 'react';

import { SINCE_PREFIX, type ColumnFilter } from '../../lib/tableFilter';
import type { SortEntry } from '../../lib/tableSort';
import { UnicodeSpinner } from '../UnicodeSpinner';
import { FilterPopover } from './FilterPopover';
import { CHIP, CHIP_CLEAR, CHIP_LABEL, SEARCH_INPUT, SEARCH_WRAP } from './styles';
import { toOption, type FilterField } from './types';

type Props = {
	fields: FilterField[];
	search: string;
	onSearchChange: (value: string) => void;
	filters: ColumnFilter[];
	onFiltersChange: (filters: ColumnFilter[]) => void;
	sortEntries: SortEntry[];
	onSortChange: (entries: SortEntry[]) => void;
	placeholder?: string;
	/** Server-side search in flight — shows a spinner inside the input. */
	searching?: boolean;
	datePresets?: { value: string; label: string }[];
};

export function FilterToolbar({
	fields,
	search,
	onSearchChange,
	filters,
	onFiltersChange,
	sortEntries,
	onSortChange,
	placeholder = 'Search…',
	searching = false,
	datePresets = []
}: Props) {
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

				<FilterPopover
					fields={fields}
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
