import type { CellLike } from './cells';
import type { CitationView } from './citations';
import { Store, useStore } from './store';

export type CitationLineageModalState = {
	citation: CitationView;
	/** Chat cells by id, to resolve a clicked lineage node back to its code. */
	cellsById: Map<string, CellLike>;
	/** Node (cell) to open inspected, so a map click lands on its code. */
	initialCellId: string | null;
};

class CitationLineageModalStore extends Store<{ current: CitationLineageModalState | null }> {
	constructor() {
		super({ current: null });
	}

	open(citation: CitationView, cellsById: Map<string, CellLike>, initialCellId?: string) {
		this.set({ current: { citation, cellsById, initialCellId: initialCellId ?? null } });
	}

	close() {
		this.set({ current: null });
	}
}

/** Drives the shared <CitationLineageModal />; open it from anywhere with a citation. */
export const citationLineageModal = new CitationLineageModalStore();

export function useCitationLineageModal(): CitationLineageModalState | null {
	return useStore(citationLineageModal).current;
}
