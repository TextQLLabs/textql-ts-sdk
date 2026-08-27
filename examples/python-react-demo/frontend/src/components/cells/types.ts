import type { ComponentType } from 'react';

import type { CellLike } from '../../lib/cells';

/**
 * What every cell body receives. The dispatcher resolves the payload and the
 * exec error once so a cell never re-derives them, and the shared CellShell
 * has already drawn the icon, title, summary and error card by the time a cell
 * renders — a cell body contains only what is specific to its own type.
 */
export type CellComponentProps = {
	cell: CellLike;
	payload: Record<string, unknown>;
	/** Already rendered by CellShell; here for cells that alter their body on failure. */
	execError: string;
};

export type CellComponent = ComponentType<CellComponentProps>;
