import { storageGet, storageSet } from "$lib/utils";

export type ThemeChoice = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

// Shared with the no-FOUC inline script in app.html — keep in sync.
export const THEME_STORAGE_KEY = "chat-demo.theme";

function loadChoice(): ThemeChoice {
	const raw = storageGet(THEME_STORAGE_KEY);
	return raw === "light" || raw === "dark" || raw === "system" ? raw : "system";
}

function systemPrefersDark(): boolean {
	return (
		typeof window !== "undefined" &&
		typeof window.matchMedia === "function" &&
		window.matchMedia("(prefers-color-scheme: dark)").matches
	);
}

class ThemePref {
	#choice = $state<ThemeChoice>(loadChoice());
	#systemDark = $state(systemPrefersDark());

	constructor() {
		if (typeof window !== "undefined" && typeof window.matchMedia === "function") {
			window
				.matchMedia("(prefers-color-scheme: dark)")
				.addEventListener("change", (event) => {
					this.#systemDark = event.matches;
					this.#apply();
				});
		}
		this.#apply();
	}

	/** The user's explicit selection ("system" defers to the OS). */
	get choice(): ThemeChoice {
		return this.#choice;
	}

	set choice(value: ThemeChoice) {
		this.#choice = value;
		storageSet(THEME_STORAGE_KEY, value);
		this.#apply();
	}

	/** The concrete theme currently rendered. */
	get resolved(): ResolvedTheme {
		if (this.#choice === "system") return this.#systemDark ? "dark" : "light";
		return this.#choice;
	}

	/** Simple light <-> dark flip for a one-click toggle. */
	toggle() {
		this.choice = this.resolved === "dark" ? "light" : "dark";
	}

	#apply() {
		if (typeof document !== "undefined") {
			document.documentElement.dataset.theme = this.resolved;
		}
	}
}

export const themePref = new ThemePref();
