/**
 * Faceted-filter vocabulary shared by the toolbar UI and the list routes. A
 * filter is a set of selected values for a field (OR within, AND across).
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
