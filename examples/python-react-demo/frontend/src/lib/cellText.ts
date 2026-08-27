/**
 * The type scale for the cell surface — cells, their steps, and the preview
 * panel. Nothing on that surface hardcodes a px size; it composes these so a
 * body line in a SQL cell, a list row, and a preview table all match.
 */

/** Readable content: prose, values, table cells, form controls. */
export const CELL_BODY = 'text-[12.5px] leading-[1.55]';

/** Secondary content: keys, subtitles, captions, summaries. */
export const CELL_META = 'text-[11.5px] leading-[1.45]';

/** Section headings above a block, and column headers. */
export const CELL_LABEL = 'text-[11px] font-semibold tracking-[0.02em] uppercase';

/** Monospace: code, query text, raw output. */
export const CELL_CODE = 'font-mono text-[11.5px] leading-[1.45]';
