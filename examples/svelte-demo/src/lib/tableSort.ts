/**
 * Pure, framework-agnostic sorting helpers. Sibling to tableFilter.ts — no
 * Svelte imports, so it stays trivially unit-testable.
 */

export type SortDir = 'asc' | 'desc';
export type SortEntry = { columnId: string; dir: SortDir };

const isNullish = (v: unknown): v is null | undefined => v === null || v === undefined;

/**
 * Ascending comparator. Numbers compare numerically, Dates by timestamp,
 * everything else via locale-aware string compare with `numeric: true` so
 * numeric-looking strings ("129", "3.0") order like numbers.
 */
export function compareValues(a: unknown, b: unknown): number {
  // Keep nullish last in ascending order for standalone callers.
  if (isNullish(a) && isNullish(b)) return 0;
  if (isNullish(a)) return 1;
  if (isNullish(b)) return -1;

  if (typeof a === 'number' && typeof b === 'number') return a - b;
  if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime();
  if (typeof a === 'boolean' && typeof b === 'boolean') return a === b ? 0 : a ? 1 : -1;
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });
}

/** Minimal field shape applySort needs to resolve a row's sort value. */
export interface SortableColumn<Row> {
  id: string;
  sortValue?: (row: Row) => unknown;
  accessor?: (row: Row) => unknown;
}

export function resolveSortValue<Row>(column: SortableColumn<Row>, row: Row): unknown {
  if (column.sortValue) return column.sortValue(row);
  if (column.accessor) return column.accessor(row);
  return (row as Record<string, unknown>)[column.id];
}

/**
 * Returns a NEW array sorted by the given multi-sort entries (entry order is
 * priority — entry 0 is primary). Never mutates `rows`. Nullish values always
 * sort last regardless of direction. Array.sort is stable, so rows with equal
 * keys keep their original relative order.
 */
export function applySort<Row>(
  rows: Row[],
  sort: SortEntry[],
  columnMap: Map<string, SortableColumn<Row>>
): Row[] {
  if (sort.length === 0) return rows;

  const copy = rows.slice();
  copy.sort((a, b) => {
    for (const { columnId, dir } of sort) {
      const column = columnMap.get(columnId);
      if (!column) continue;

      const av = resolveSortValue(column, a);
      const bv = resolveSortValue(column, b);

      // Nullish always last, independent of sort direction.
      const aN = isNullish(av);
      const bN = isNullish(bv);
      if (aN && bN) continue;
      if (aN) return 1;
      if (bN) return -1;

      const cmp = compareValues(av, bv);
      if (cmp !== 0) return dir === 'asc' ? cmp : -cmp;
    }
    return 0;
  });
  return copy;
}

/** Field shape the sort menu needs to label and toggle an entry. */
export interface SortMenuColumn<Row = unknown> extends SortableColumn<Row> {
  header?: string;
  sortType?: 'text' | 'number' | 'date';
  sortLabels?: { asc: string; desc: string };
}

/** Human-readable direction label for the sort menu (avoid "asc/desc"). */
export function sortDirectionLabel(column: SortMenuColumn, dir: SortDir): string {
  if (column.sortLabels) return dir === 'asc' ? column.sortLabels.asc : column.sortLabels.desc;
  const t = column.sortType ?? 'text';
  if (t === 'date') return dir === 'asc' ? 'Oldest' : 'Latest';
  if (t === 'number') return dir === 'asc' ? 'Lowest' : 'Highest';
  return dir === 'asc' ? 'A–Z' : 'Z–A';
}

/**
 * Single-field 2-state toggle used by the sort menu: asc <-> desc, never
 * clearing (a "Clear sort" affordance handles that). A dead "cleared" step is
 * something server-sorted lists can't act on. A fresh field starts desc for
 * date/number, asc for text.
 */
export function toggleSortEntry(
  current: SortEntry[],
  columnId: string,
  column: SortMenuColumn | undefined
): SortEntry[] {
  const existing = current.find((s) => s.columnId === columnId);
  const dir: SortDir = existing
    ? existing.dir === 'asc'
      ? 'desc'
      : 'asc'
    : column?.sortType === 'date' || column?.sortType === 'number'
      ? 'desc'
      : 'asc';
  return [{ columnId, dir }];
}
