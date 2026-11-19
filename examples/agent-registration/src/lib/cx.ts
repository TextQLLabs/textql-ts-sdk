/** Join truthy class names — the React stand-in for Svelte's `class:` directives. */
export function cx(...parts: (string | false | null | undefined)[]): string {
	return parts.filter(Boolean).join(' ');
}
