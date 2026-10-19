import { getCellCase, getCellPayload, type CellLike } from './cells';
import { asString } from './cells';

/**
 * A cell the run is *parked on*. These stop the agent until someone acts, so
 * they can't sit collapsed inside a tool batch like an ordinary step — the
 * stream simply goes quiet and the chat looks hung.
 */
export type Halt =
	| { kind: 'ontology'; title: string; detail: string }
	| { kind: 'contextPrompt'; title: string; detail: string };

/** Patch statuses that are still waiting on a decision. */
const OPEN_PATCH = new Set(['PATCH_STATUS_OPEN', 'PATCH_STATUS_DRAFT']);

export function getHalt(cell: CellLike): Halt | null {
	const payload = getCellPayload(cell);

	switch (getCellCase(cell)) {
		case 'patchCell': {
			const status = asString(payload.status);
			if (!OPEN_PATCH.has(status) || payload.autoApproved === true) return null;
			return {
				kind: 'ontology',
				title: asString(payload.title) || 'Ontology patch',
				detail: asString(payload.description)
			};
		}
		case 'contextPromptEditorCell': {
			if (asString(payload.status) !== 'STATUS_PENDING') return null;
			return {
				kind: 'contextPrompt',
				title: 'Context prompt change',
				detail: asString(payload.diff) || asString(payload.proposedContext)
			};
		}
		default:
			return null;
	}
}
