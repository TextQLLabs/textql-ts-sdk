import { Store, useStore } from './store';
import { storageGet, storageSet } from './utils';

export type PromptView = 'write' | 'preview';

// Shared across every markdown prompt editor (playbooks, agents, …) so the
// Write/Preview choice is remembered and consistent between pages.
const STORAGE_KEY = 'chat-demo.promptView';

function load(): PromptView {
	return storageGet(STORAGE_KEY) === 'preview' ? 'preview' : 'write';
}

class PromptViewPref extends Store<{ mode: PromptView }> {
	constructor() {
		super({ mode: load() });
	}

	get mode(): PromptView {
		return this.state.mode;
	}

	setMode = (value: PromptView): void => {
		this.set({ mode: value });
		storageSet(STORAGE_KEY, value);
	};
}

export const promptViewPref = new PromptViewPref();

export function usePromptView(): PromptView {
	return useStore(promptViewPref).mode;
}
