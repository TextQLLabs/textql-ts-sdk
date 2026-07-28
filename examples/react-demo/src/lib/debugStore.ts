import { Store, useStore } from './store';
import { isDebugEnabled } from './utils';

class DebugStore extends Store<{ enabled: boolean }> {
	constructor() {
		super({ enabled: isDebugEnabled() });
	}

	setEnabled(enabled: boolean) {
		this.set({ enabled });
	}
}

export const debugStore = new DebugStore();

export function useDebug(): boolean {
	return useStore(debugStore).enabled;
}
