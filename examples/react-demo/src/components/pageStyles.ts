/**
 * Class strings shared by the list pages (threads / agents / apps / playbooks).
 * In the Svelte demo each page carried its own byte-identical copy of these
 * rules because scoped `<style>` blocks can't be shared; as utilities they
 * collapse into one place.
 *
 * Keep these free of any property a caller needs to override — Tailwind decides
 * which of two same-property utilities wins by its own rule order, not by the
 * order they appear in a class string.
 */

export const LIST_SECTION = 'flex w-full flex-col gap-3.5';
/** Pages whose list owns the scroll (agents, apps, playbooks). */
export const LIST_SECTION_SCROLL = `${LIST_SECTION} min-h-0 flex-1 overflow-y-auto`;

export const BOARD = 'flex w-full flex-col gap-7';
export const BOARD_GROUP = 'flex min-w-0 flex-col gap-2.5';
export const BOARD_GROUP_HEAD = 'flex flex-col gap-0.5 px-0.5';
export const BOARD_GROUP_TITLE_ROW = 'flex items-baseline gap-2';
export const BOARD_GROUP_TITLE =
	'm-0 font-sans text-[12px] font-semibold tracking-[0.06em] text-ink uppercase';
export const BOARD_GROUP_COUNT = 'font-mono text-[11px] font-medium text-muted';
export const BOARD_GROUP_HINT = 'm-0 text-[11.5px] leading-[1.4] text-muted';
export const BOARD_LIST = 'm-0 flex list-none flex-col gap-0.5 p-0';

export const STATE_BLOCK =
	'flex flex-col items-center justify-center gap-2.5 px-4 py-12 text-center';
export const STATE_TITLE = 'm-0 text-[15px] font-medium text-ink';
export const STATE_TEXT = 'm-0 text-[13px] leading-[1.45] text-muted';

export const RETRY_BTN =
	'cursor-pointer rounded-sm border-0 bg-transparent px-2.5 py-1.5 text-[12.5px] text-accent hover:bg-elevate/60';

/** Header action button ("New chat", "New playbook"). */
export const NEW_BTN =
	'inline-flex cursor-pointer items-center gap-[5px] rounded-sm border-0 bg-elevate/70 px-[9px] py-[5px] text-[12px] font-medium text-text-2 shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-line)_75%,transparent)] transition-[background] duration-[120ms] hover:not-disabled:bg-elevate/92 disabled:cursor-wait disabled:opacity-75 [&_svg]:shrink-0';

/** Row overflow menu: hidden until the row is hovered / focused / active. */
export const MENU_WRAP = 'group/menu relative mr-1 shrink-0';
export const MENU_BTN_BASE =
	'inline-flex size-7 cursor-pointer items-center justify-center rounded-xs border-0 bg-transparent text-muted transition-[opacity,background,color] duration-[120ms] hover:not-disabled:bg-elevate/70 hover:not-disabled:text-ink disabled:cursor-wait';
export const MENU_BTN_HIDDEN =
	'pointer-events-none opacity-0 group-hover/row:pointer-events-auto group-hover/row:opacity-100 group-focus-within/menu:pointer-events-auto group-focus-within/menu:opacity-100 focus-visible:pointer-events-auto focus-visible:opacity-100';
export const MENU_BTN_SHOWN = 'pointer-events-auto opacity-100';
export const MENU_POPOVER =
	'absolute top-[calc(100%+2px)] right-0 z-[5] min-w-24 rounded-sm border border-line/85 bg-[color-mix(in_srgb,var(--color-paper)_96%,var(--color-elevate))] p-[3px] shadow-[0_4px_14px_rgba(15,15,20,0.06)]';
export const MENU_ITEM =
	'block w-full cursor-pointer rounded-[5px] border-0 bg-transparent px-2 py-1.5 text-left text-[12px] text-text-3 hover:bg-elevate/70 hover:text-ink';

/** Spinner shown inside a row; `row-spinner` stays a plain class for parity. */
export const ROW_SPINNER = 'row-spinner shrink-0 opacity-85';
