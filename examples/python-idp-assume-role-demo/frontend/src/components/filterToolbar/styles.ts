/**
 * Shared class strings for the filter toolbar. Mirrors the scoped CSS in the
 * SvelteKit demo's `primitives/FilterToolbar` so the two stay recognisably the
 * same control.
 */

const RESET = 'border-0 bg-transparent font-[inherit] cursor-pointer';

export const FACET_ROW = `${RESET} flex w-full items-center gap-2 rounded-[5px] px-2 py-1.5 text-left text-xs text-text-3 hover:bg-elevate/70 disabled:cursor-default disabled:opacity-50 disabled:hover:bg-transparent`;
export const FACET_ROW_LABEL = 'min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap';
export const FACET_ROW_VALUE =
	'max-w-[110px] shrink-0 overflow-hidden text-ellipsis whitespace-nowrap text-[11.5px] text-muted';

const CHECK_BASE =
	'flex size-3.5 shrink-0 items-center justify-center rounded border text-paper';
export const FACET_CHECK = `${CHECK_BASE} border-line/90`;
export const FACET_CHECK_ON = `${CHECK_BASE} border-accent bg-accent`;

// The panel clips; the list inside it scrolls, so the drilldown header, search
// box and "Clear all" footer stay pinned.
export const PANEL =
	'fixed z-[1000] flex flex-col overflow-hidden rounded-[var(--radius-sm)] border border-line/85 bg-[color-mix(in_srgb,var(--color-paper)_96%,var(--color-elevate))] p-1 shadow-[0_8px_24px_rgba(15,15,20,0.1)]';
export const PANEL_SCROLL = 'flex min-h-0 flex-col overflow-y-auto overscroll-contain';

export const TRIGGER = `${RESET} inline-flex h-[30px] items-center gap-1.5 rounded-[var(--radius-sm)] px-[9px] text-xs font-medium text-text-2 shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-line)_75%,transparent)] transition-colors`;
export const TRIGGER_IDLE = 'bg-elevate/70 hover:bg-elevate/90';
export const TRIGGER_ACTIVE = 'bg-elevate/90';

export const BADGE =
	'min-w-4 rounded-full bg-accent px-1 text-center font-mono text-[10px] leading-4 text-paper';

export const SECTION =
	'mt-0.5 border-t border-line/55 px-2 pt-2 pb-1 text-[10px] font-semibold tracking-[0.06em] text-muted uppercase';

export const CLEAR = `${RESET} rounded-[5px] px-1.5 py-0.5 text-[11.5px] text-accent hover:bg-elevate/70`;

export const NOTE = 'm-0 px-2 pt-1 pb-2 text-[11.5px] leading-[1.4] text-muted';

export const AVATAR =
	'flex size-[18px] shrink-0 items-center justify-center rounded-full bg-line/40 object-cover text-[9px] font-semibold text-text-2';

export const SEARCH_INPUT =
	'min-w-0 flex-1 border-0 bg-transparent text-xs text-ink outline-none [&::-webkit-search-cancel-button]:appearance-none';

export const CHIP = `${RESET} inline-flex max-w-[240px] items-center gap-1.5 rounded-full bg-elevate/80 py-[3px] pr-1.5 pl-2 text-[11px] text-text-2 shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-line)_70%,transparent)] hover:text-ink`;
export const CHIP_LABEL = 'min-w-0 overflow-hidden text-ellipsis whitespace-nowrap';
export const CHIP_CLEAR = `${RESET} rounded-[5px] px-1.5 py-[3px] text-[11px] text-accent hover:bg-elevate/60`;

export const SEARCH_WRAP =
	'flex h-[30px] min-w-0 flex-1 items-center gap-1.5 rounded-[var(--radius-sm)] bg-elevate/55 px-[9px] text-muted shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-line)_70%,transparent)]';
