/**
 * Pure, framework-agnostic sort-menu helpers. Sibling to tableFilter.ts — no
 * framework imports, so it stays trivially unit-testable.
 */

export type SortDir = 'asc' | 'desc';
export type SortEntry = { columnId: string; dir: SortDir };

/** Field shape the sort menu needs to label and toggle an entry. */
export interface SortMenuColumn {
  id: string;
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
