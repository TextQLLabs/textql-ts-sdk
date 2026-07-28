export type SelectOption<V extends string | number> = {
	value: V;
	label: string;
	/** Secondary line shown beneath the label. */
	hint?: string;
	/** Optional image URL rendered as a leading icon (e.g. a connector logo). */
	iconSrc?: string;
	disabled?: boolean;
};
