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

/** Same idea for the page's `<meta name="description">`. */
export function usePageDescription(description: string): void {
	useEffect(() => {
		let tag = document.head.querySelector<HTMLMetaElement>('meta[name="description"]');
		let created = false;
		if (!tag) {
			tag = document.createElement('meta');
			tag.name = 'description';
			document.head.appendChild(tag);
			created = true;
		}
		const previous = tag.content;
		tag.content = description;
		return () => {
			if (created) tag?.remove();
			else if (tag) tag.content = previous;
		};
	}, [description]);
}
