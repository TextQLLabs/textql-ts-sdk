import { browser } from '$app/environment';

// Lazily loads @pierre/trees' built-in file-icon sprite (colored VSCode-style)
// and exposes a filename → <symbol> id resolver for use with <use href="#id">.
// SVG <use> resolves live, so icons appear as soon as the sprite is injected.

let ready = $state(false);
let resolve: ((name: string) => string) | null = null;
let started = false;

export function pierreIconsReady(): boolean {
	return ready;
}

export function pierreFileIconId(name: string): string | undefined {
	return resolve ? resolve(name) : undefined;
}

export async function initPierreIcons(): Promise<void> {
	if (!browser || started) return;
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
	ready = true;
}
