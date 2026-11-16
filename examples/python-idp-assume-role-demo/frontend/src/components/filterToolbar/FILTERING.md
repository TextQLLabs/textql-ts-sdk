# FilterToolbar

The shared Search + Filter + Sort bar. Reach for it instead of pairing a bare
input with a hand-rolled filter popover. `ThreadsPage.tsx` is the reference
caller.

Filtering and sorting are server-side: the toolbar only emits state. Turn
`filters` / `sortEntries` / `search` into request params and refetch from page 0
— `usePagedList` (`src/lib/usePagedList.ts`) does exactly that, debouncing the
refetch by 250ms since `search` changes on every keystroke.

## Fields

Each `FilterField` declares one property the list can be filtered and/or sorted
by. A `filterable` field picks how its drilldown renders with `filterKind`:

| `filterKind`       | Drilldown                                               | Holds                                         |
| ------------------ | ------------------------------------------------------- | --------------------------------------------- |
| `values` (default) | Searchable checkbox list; per-option `icon`             | Any number of option values                   |
| `people`           | Same list with an avatar per row (monogram if no photo) | Any number of option values                   |
| `date`             | `DateRangeFilter` — presets over a since-date           | One value: a preset id, or `since:YYYY-MM-DD` |

All three land in the same `ColumnFilter[]`, so the trigger count, chips and
"Clear all" work identically across them. The option search box appears once a
facet has more than 8 options.

Every facet must declare its own `filterOptions` — options derived from the one
page of rows currently loaded would be wrong.

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

### Date values

A date facet stores one string: a preset's `value`, or `since:YYYY-MM-DD`. The
toolbar only stores it — the caller decides what it means. Import `SINCE_PREFIX`
from `../../lib/tableFilter` to tell the two apart. Note this is a *since* date,
not a range; there is no end-date control.
