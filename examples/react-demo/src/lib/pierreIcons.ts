import { Store, useStore } from './store';

// Lazily loads @pierre/trees' built-in file-icon sprite (colored VSCode-style)
// and exposes a filename → <symbol> id resolver for use with <use href="#id">.
// SVG <use> resolves live, so icons appear as soon as the sprite is injected.

let resolve: ((name: string) => string) | null = null;
let started = false;

const readyStore = new (class extends Store<{ ready: boolean }> {
	constructor() {
		super({ ready: false });
	}
	markReady() {
		this.set({ ready: true });
	}
})();

export function pierreIconsReady(): boolean {
	return readyStore.state.ready;
}

/** Reactive form of {@link pierreIconsReady} for components. */
export function usePierreIconsReady(): boolean {
	return useStore(readyStore).ready;
}

export function pierreFileIconId(name: string): string | undefined {
	return resolve ? resolve(name) : undefined;
}

export async function initPierreIcons(): Promise<void> {
	if (typeof document === 'undefined' || started) return;
	started = true;

	const { getBuiltInSpriteSheet, createFileTreeIconResolver } = await import('@pierre/trees');

	// Inject the sprite once, hidden, so <use> references resolve document-wide.
	const holder = document.createElement('div');
	holder.setAttribute('aria-hidden', 'true');
	holder.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
	holder.innerHTML = getBuiltInSpriteSheet('complete');
	document.body.appendChild(holder);

	const { resolveIcon } = createFileTreeIconResolver({ set: 'complete', colored: true });
	// resolveIcon returns the <symbol> id (no leading '#') for the file's type.
	resolve = (name: string) => resolveIcon('file-tree-icon-file', name).name;
	readyStore.markReady();
}
