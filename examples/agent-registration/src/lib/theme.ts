import { useState } from 'react';

// Shared with the no-flash inline script in index.html.
const THEME_STORAGE_KEY = 'agent-registration.theme';

type Theme = 'light' | 'dark';

export function useTheme() {
	const [theme, setTheme] = useState<Theme>(() =>
		document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
	);

	function toggle() {
		const next: Theme = theme === 'dark' ? 'light' : 'dark';
		document.documentElement.dataset.theme = next;
		try {
			localStorage.setItem(THEME_STORAGE_KEY, next);
		} catch {
			// Private mode: the choice just won't persist.
		}
		setTheme(next);
	}

	return { theme, toggle };
}
