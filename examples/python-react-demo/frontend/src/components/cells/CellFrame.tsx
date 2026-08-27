import type { ReactNode } from 'react';

import {
	asString,
	getCellCase,
	getCellToolSummary,
	getCellTypeInfo,
	getToolDisplayName,
	usesCellShell,
	type CellLike
} from '../../lib/cells';
import { CellShell } from '../CellShell';

type Props = {
	cell: CellLike;
	/** Header-right controls owned by this cell — the shell decides where they sit. */
	actions?: ReactNode;
	children?: ReactNode;
};

/**
 * Every cell body wraps itself in this. It derives the icon, title, summary and
 * error from the cell so no cell restates them, and it is the only place that
 * honours a type's `standalone` opt-out — which is why a cell can contribute
 * header actions without being able to move, restyle, or skip the chrome.
 */
export function CellFrame({ cell, actions, children }: Props) {
	const cellCase = getCellCase(cell);
	const execError = asString(cell.execError);

	if (!usesCellShell(cellCase)) return <>{children}</>;

	return (
		<CellShell
			icon={getCellTypeInfo(cellCase).icon}
			title={getToolDisplayName(cell)}
			summary={getCellToolSummary(cell)}
			error={execError || null}
			actions={actions}
		>
			{children}
		</CellShell>
	);
}
