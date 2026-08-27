import type { ComponentType } from 'react';

/** One selectable value in a facet. `value` is what lands in ColumnFilter. */
export type FilterOption = {
	value: string;
	label: string;
	/** Lucide (or any) icon component, rendered before the label. */
	icon?: ComponentType<{ size?: number | string; strokeWidth?: number | string }>;
	/** Avatar source for `filterKind: 'people'`; falls back to a monogram. */
	imageUrl?: string | null;
};

/** A property a list can be filtered and/or sorted by. */
export type FilterField = {
	id: string;
	header: string;
	sortable?: boolean;
	sortType?: 'text' | 'number' | 'date';
	filterable?: boolean;
	filterOptions?: (string | FilterOption)[];
	filterKind?: 'values' | 'people' | 'date';
};

/** Normalise the `string | FilterOption` union to always-an-object. */
export function toOption(option: string | FilterOption): FilterOption {
	return typeof option === 'string' ? { value: option, label: option } : option;
}
