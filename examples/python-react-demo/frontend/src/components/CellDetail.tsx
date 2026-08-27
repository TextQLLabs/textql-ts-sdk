import {
	getCellCase,
	getCellPayload,
	getCellTypeInfo,
	getToolDisplayName,
	usesCellShell,
	type CellLike
} from '../lib/cells';
import { CellShell } from './CellShell';
import { getCellComponent } from './cells/registry';

/**
 * Dispatch: resolve the cell's component and give it the shared card. The shell
 * owns the icon, title, summary and error card for every type, so a cell body
 * is only ever the part that differs.
 */
export function CellDetail({ cell }: { cell: CellLike }) {
	const cellCase = getCellCase(cell);
	const info = getCellTypeInfo(cellCase);
	const execError = typeof cell.execError === 'string' ? cell.execError : '';

	const Body = getCellComponent(cellCase);
	const body = <Body cell={cell} payload={getCellPayload(cell)} execError={execError} />;

	if (!usesCellShell(cellCase)) return body;

	return (
		<CellShell
			icon={info.icon}
			title={getToolDisplayName(cell)}
			summary={typeof cell.toolSummary === 'string' ? cell.toolSummary : null}
			error={execError || null}
		>
			{body}
		</CellShell>
	);
}
