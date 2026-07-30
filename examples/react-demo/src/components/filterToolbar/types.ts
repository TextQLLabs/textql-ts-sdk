import type { ComponentType } from 'react';

/** One selectable value in a facet. `value` is what lands in ColumnFilter. */
export type FilterOption = {
	value: string;
	label: string;
	/** Lucide (or any) icon component, rendered before the label. */
	icon?: ComponentType<{ size?: number | string; strokeWidth?: number }>;
	/** Avatar source for `filterKind: 'people'`; falls back to a monogram. */
	imageUrl?: string | null;
};

/**
 * A property a list can be filtered and/or sorted by.
 *
 * Deliberately a structural subset of demo2's DataTable `Column` type, using
 * the same field names — so a table surface could pass its existing columns
 * straight through, while a card/row surface declares fields on their own.
 *
 * `Row` defaults to `any` (as it does in demo2) so a page can declare
 * `FilterField<MyRow>[]` and still hand it to a toolbar typed `FilterField[]`
 * — the row callbacks are contravariant, so `unknown` would reject it.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type FilterField<Row = any> = {
	id: string;
	header: string;
	sortable?: boolean;
	sortType?: 'text' | 'number' | 'date';
	sortLabels?: { asc: string; desc: string };
	sortValue?: (row: Row) => unknown;
	filterable?: boolean;
	filterOptions?: (string | FilterOption)[];
	filterAllLabel?: string;
	filterKind?: 'values' | 'people' | 'date';
	filterDisabled?: boolean;
	filterNote?: string;
	filterValue?: (row: Row) => unknown;
	accessor?: (row: Row) => unknown;
};

/** A scope tab in the toolbar — "All", "Created by you", "Shared", … */
export type FilterTab = {
	id: string;
	label: string;
	count?: number;
};

/** Normalise the `string | FilterOption` union to always-an-object. */
export function toOption(option: string | FilterOption): FilterOption {
	return typeof option === 'string' ? { value: option, label: option } : option;
}
