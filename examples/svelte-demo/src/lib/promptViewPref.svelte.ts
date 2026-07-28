import { storageGet, storageSet } from "$lib/utils";

export type PromptView = "write" | "preview";

// Shared across every markdown prompt editor (playbooks, agents, …) so the
// Write/Preview choice is remembered and consistent between pages.
const STORAGE_KEY = "chat-demo.promptView";

function load(): PromptView {
	return storageGet(STORAGE_KEY) === "preview" ? "preview" : "write";
}

class PromptViewPref {
	#mode = $state<PromptView>(load());

	get mode(): PromptView {
		return this.#mode;
	}

	set mode(value: PromptView) {
		this.#mode = value;
		storageSet(STORAGE_KEY, value);
	}
}

export const promptViewPref = new PromptViewPref();
