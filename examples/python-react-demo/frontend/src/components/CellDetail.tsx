import { asString, getCellCase, getCellPayload, type CellLike } from '../lib/cells';
import { getCellComponent } from './cells/registry';

/**
 * Dispatch only. The resolved cell renders its own CellFrame, which is what
 * lets a cell put controls in the header without owning any of the chrome.
 */
export function CellDetail({ cell }: { cell: CellLike }) {
	const Body = getCellComponent(getCellCase(cell));
	const execError = asString(cell.execError);

	return <Body cell={cell} payload={getCellPayload(cell)} execError={execError} />;
}
