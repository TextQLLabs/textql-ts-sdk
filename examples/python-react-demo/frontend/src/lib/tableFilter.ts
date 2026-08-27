/**
 * Pure, framework-agnostic faceted-filter helpers. A filter is a set of
 * selected values for a field; a row passes a filter if its value is one of the
 * selected (OR within a field), and must pass every active filter (AND across
 * fields). Sibling to tableSort.ts — no framework imports.
 */

export type ColumnFilter = { columnId: string; values: string[] };
export const SINCE_PREFIX = 'since:';

/**
 * Date facet vocabulary, shared by the UI and the list routes. `days` is what
 * the server turns into a lower bound, so a preset added here can never render
 * as a filter the server silently ignores.
 */
export const DATE_PRESETS: { value: string; label: string; days: number }[] = [
  { value: 'today', label: 'Today', days: 1 },
  { value: 'week', label: 'Last 7 days', days: 7 },
  { value: 'month', label: 'Last 30 days', days: 30 },
  { value: 'quarter', label: 'Last 90 days', days: 90 }
];

const PRESET_DAYS = new Map(DATE_PRESETS.map((preset) => [preset.value, preset.days]));

/**
 * Date facet value — a preset id or `since:YYYY-MM-DD` — to a lower bound.
 *
 * Lives here rather than in the server helpers because both sides need it: the
 * list routes turn it into an RPC `createdAfter`, and the surfaces that filter
 * client-side compare row timestamps against it. Two copies would drift.
 */
export function createdAfterFor(value: string | null | undefined): Date | undefined {
  if (!value) return undefined;

  if (value.startsWith(SINCE_PREFIX)) {
    const parsed = new Date(`${value.slice(SINCE_PREFIX.length)}T00:00:00`);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  }

  const days = PRESET_DAYS.get(value);
  if (days === undefined) return undefined;
  const since = new Date();
  since.setHours(0, 0, 0, 0);
  since.setDate(since.getDate() - (days - 1));
  return since;
}

/** Minimal field shape the filter helpers need. */
export interface FilterableColumn<Row> {
  id: string;
  filterValue?: (row: Row) => unknown;
  accessor?: (row: Row) => unknown;
}

/**
 * Resolve ALL strings a row contributes for a field. Supports multi-value
 * fields whose `filterValue` returns an array: each element becomes its own
 * facet option and matches independently. Single-value fields return a
 * one-element array, so behaviour is unchanged for them.
 */
export function filterValuesOf<Row>(column: FilterableColumn<Row>, row: Row): string[] {
  const v = column.filterValue
    ? column.filterValue(row)
    : column.accessor
      ? column.accessor(row)
      : (row as Record<string, unknown>)[column.id];
  if (v === null || v === undefined) return [];
  const arr = Array.isArray(v) ? v : [v];
  return arr.map((x) => (x === null || x === undefined ? '' : String(x))).filter((s) => s !== '');
}

/** Distinct, sorted, non-empty values for a field — the facet options. */
export function distinctValues<Row>(rows: Row[], column: FilterableColumn<Row>): string[] {
  const set = new Set<string>();
  for (const row of rows) {
    for (const text of filterValuesOf(column, row)) set.add(text);
  }
  return Array.from(set).sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
  );
}

/**
 * Returns a NEW array of rows passing all active filters. Never mutates input.
 * Filters with no selected values are ignored.
 */
export function applyFilters<Row>(
  rows: Row[],
  filters: ColumnFilter[],
  columnMap: Map<string, FilterableColumn<Row>>
): Row[] {
  const active = filters.filter((f) => f.values.length > 0);
  if (active.length === 0) return rows;

  return rows.filter((row) =>
    active.every((f) => {
      const column = columnMap.get(f.columnId);
      if (!column) return true;
      // Row passes if ANY of its values is selected (OR within a field) —
      // covers multi-value fields as well as single-value ones.
      const rowValues = filterValuesOf(column, row);
      return rowValues.some((v) => f.values.includes(v));
    })
  );
}
