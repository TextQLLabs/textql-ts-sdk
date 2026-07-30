# FilterToolbar

The shared Search + Filter + Sort bar, ported from demo2's
`lib/components/ui/filter-toolbar`. Reach for it instead of pairing a bare
input with a hand-rolled filter popover.

```tsx
<FilterToolbar
  fields={fields}
  items={[]}
  search={list.search}
  filters={list.filters}
  sortEntries={list.sortEntries}
/>
```

`fields` is a `FilterField[]` — a structural subset of demo2's DataTable
`Column` type using the same field names, so a table surface could pass its
existing columns straight through.

## Facet kinds

A `filterable` field picks how its drilldown renders with `filterKind`:

| `filterKind`       | Drilldown                                        | Holds                                         |
| ------------------ | ------------------------------------------------ | --------------------------------------------- |
| `values` (default) | Searchable checkbox list; per-option `icon`      | Any number of option values                   |
| `people`           | Same list with an avatar per row (monogram if no photo) | Any number of option values            |
| `date`             | `DateRangeFilter` — presets over a since-date    | One value: a preset id, or `since:YYYY-MM-DD` |

All three land in the same `ColumnFilter[]`, so the trigger count, chips,
"Clear all" and `persistKey` persistence work identically across them. Only the
body of the drilldown differs.

The option search box appears once a facet has more than 8 options.

### Options: value vs. label

`filterOptions` accepts plain strings or `FilterOption` objects:

```ts
filterOptions: ['Active', 'Inactive']; // value === label
filterOptions: members.map((m) => ({
  value: m.id, // → ColumnFilter.values
  label: m.name ?? m.email, // → shown in the row and chip
  imageUrl: m.pictureUrl // → avatar, with `filterKind: 'people'`
}));
```

Only `value` reaches `ColumnFilter.values`; the rest is presentation. That split
is what lets a facet key on an opaque id while the row still reads as a name
with a face next to it.

**Client-side surfaces must keep `value` equal to the row's `filterValue`
text** — that is what `applyFilters` compares against. A facet keyed on ids only
works where the filtering understands ids (i.e. server-side, below).

### Date values

A date facet stores one string: a preset's `value`, or `since:YYYY-MM-DD`.
The toolbar only stores it — the caller decides what it means. Import
`SINCE_PREFIX` from `../../lib/tableFilter` to tell the two apart:

```ts
if (value.startsWith(SINCE_PREFIX)) {
  const iso = value.slice(SINCE_PREFIX.length);
  // …
}
```

Note this is a *since* date, not a range. There is no end-date control.

## Server-side surfaces

The toolbar is client-side by default: facet options come from
`distinctValues(items, field)`, and the caller applies the emitted filters with
`applyFilters` / `applySort` from `../../lib/tableFilter` and `../../lib/tableSort`.

For a surface whose filtering and pagination happen on the server (Threads),
invert it:

- Pass `items={[]}` — options derived from one loaded page would be wrong, and
  filtering client-side would only ever touch that page.
- Declare every facet's `filterOptions` explicitly.
- Turn `filters` / `sortEntries` / `search` into request params and refetch from
  page 0. `ThreadsPage.tsx` is the reference conversion: it builds a
  `queryString` and debounces the refetch by 250ms, since `search` changes on
  every keystroke.

Skip `persistKey` on these surfaces if the caller already persists its own sort
— two sources of truth drift.

## Differences from demo2

This is a rebuild on the demo's own primitives, not a copy: demo2's version
delegates to `DataTableFilterBar`, which depends on bits-ui popovers,
`unplugin-icons`, `MemberAvatar` and a calendar component. Dropped here:
column-visibility toggles, `mergeSort`, the `optionActions` / `facetFooter`
slots, agent identicons, and the multi-key sort menu (sort is single-key via
`toggleSortEntry`). The date facet uses a native `<input type="date">` instead
of the calendar.

`tableFilter.ts` and `tableSort.ts` are near-verbatim ports and stay
framework-agnostic — the React demo uses the same two files.
