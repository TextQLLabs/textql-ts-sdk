import { storageGet, storageSet } from '../../lib/utils';

import type { ColumnFilter } from '../../lib/tableFilter';
import type { SortEntry } from '../../lib/tableSort';

export type ToolbarState = {
  tab?: string;
  filters?: ColumnFilter[];
  sort?: SortEntry[];
};

const PREFIX = 'filter-toolbar:';

// Persisted state outlives the code that wrote it, so entries are shape-checked
// rather than trusted: applyFilters/applySort read fields off each entry and
// would throw on a stale or hand-edited payload.
function isColumnFilter(v: unknown): v is ColumnFilter {
  const f = v as ColumnFilter | null;
  return (
    !!f &&
    typeof f === 'object' &&
    typeof f.columnId === 'string' &&
    Array.isArray(f.values) &&
    f.values.every((s) => typeof s === 'string')
  );
}

function isSortEntry(v: unknown): v is SortEntry {
  const s = v as SortEntry | null;
  return (
    !!s &&
    typeof s === 'object' &&
    typeof s.columnId === 'string' &&
    (s.dir === 'asc' || s.dir === 'desc')
  );
}

export function loadToolbarState(key: string): ToolbarState {
  const raw = storageGet(PREFIX + key);
  if (!raw) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return {};
    const { tab, filters, sort } = parsed as ToolbarState;
    return {
      tab: typeof tab === 'string' ? tab : undefined,
      filters: Array.isArray(filters) && filters.every(isColumnFilter) ? filters : undefined,
      sort: Array.isArray(sort) && sort.every(isSortEntry) ? sort : undefined
    };
  } catch {
    return {};
  }
}

export function saveToolbarState(key: string, state: ToolbarState): void {
  storageSet(PREFIX + key, JSON.stringify(state));
}
