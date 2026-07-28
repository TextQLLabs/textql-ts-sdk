import { Store, useStore } from './store';
import { storageGet, storageSet } from './utils';

export type ThemeChoice = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

// Shared with the no-FOUC inline script in index.html — keep in sync.
export const THEME_STORAGE_KEY = 'chat-demo.theme';

function loadChoice(): ThemeChoice {
	const raw = storageGet(THEME_STORAGE_KEY);
	return raw === 'light' || raw === 'dark' || raw === 'system' ? raw : 'system';
}

function systemPrefersDark(): boolean {
	return (
		typeof window !== 'undefined' &&
		typeof window.matchMedia === 'function' &&
		window.matchMedia('(prefers-color-scheme: dark)').matches
	);
}

type ThemeState = { choice: ThemeChoice; systemDark: boolean };

class ThemePref extends Store<ThemeState> {
	constructor() {
		super({ choice: loadChoice(), systemDark: systemPrefersDark() });

		if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
			window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (event) => {
				this.set({ systemDark: event.matches });
				this.#apply();
			});
		}
		this.#apply();
	}

	/** The user's explicit selection ("system" defers to the OS). */
	get choice(): ThemeChoice {
		return this.state.choice;
	}

	setChoice(value: ThemeChoice): void {
		this.set({ choice: value });
		storageSet(THEME_STORAGE_KEY, value);
		this.#apply();
	}

	/** The concrete theme currently rendered. */
	get resolved(): ResolvedTheme {
		if (this.state.choice === 'system') return this.state.systemDark ? 'dark' : 'light';
		return this.state.choice;
	}

	/** Simple light <-> dark flip for a one-click toggle. */
	toggle = (): void => {
		this.setChoice(this.resolved === 'dark' ? 'light' : 'dark');
	};

	#apply() {
		if (typeof document !== 'undefined') {
			document.documentElement.dataset.theme = this.resolved;
		}
	}
}

export const themePref = new ThemePref();

/** Reactive `resolved` theme for components. */
export function useResolvedTheme(): ResolvedTheme {
	const state = useStore(themePref);
	if (state.choice === 'system') return state.systemDark ? 'dark' : 'light';
	return state.choice;
}
