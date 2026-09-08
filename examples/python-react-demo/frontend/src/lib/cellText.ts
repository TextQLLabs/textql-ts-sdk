// The type scale for the cell surface. Nothing there hardcodes a px size; it
// composes these, so cells, steps and the preview panel stay in step.

export const CELL_BODY = 'text-[12.5px] leading-[1.55]';
export const CELL_META = 'text-[11.5px] leading-[1.45]';
export const CELL_LABEL = 'text-[11px] font-semibold tracking-[0.02em] uppercase';
export const CELL_CODE = 'font-mono text-[11.5px] leading-[1.45]';
/** A raw output block: stdout, an unparsed result. Callers add their own height cap. */
export const CODE_PRE = `${CELL_CODE} m-0 overflow-auto rounded-xs bg-ink/5 px-2.5 py-2 whitespace-pre`;
