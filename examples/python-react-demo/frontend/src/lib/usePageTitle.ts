import { useEffect } from 'react';

/**
 * React stand-in for `<svelte:head><title>…</title></svelte:head>`: sets
 * `document.title` while the component is mounted and restores it on unmount.
 */
export function usePageTitle(title: string): void {
	useEffect(() => {
		const previous = document.title;
		document.title = title;
		return () => {
			document.title = previous;
		};
	}, [title]);
}
