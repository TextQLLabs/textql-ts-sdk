export type ButtonVariant = 'solid' | 'classic' | 'soft' | 'surface' | 'outline' | 'ghost' | 'danger' | 'danger-soft';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type ConfirmTone = 'danger' | 'warning' | 'info' | 'neutral';
export type TextSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
export type TextColor = 'black' | 'muted' | 'white' | 'accent';
export type TextType = 'paragraph' | 'label' | 'heading' | 'important';
export type BadgeTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger';
export type FieldSize = 'sm' | 'md';
export type DatePreset = { label: string; from?: Date; to?: Date };

export type SegmentedOption = {
	value: string;
	label: string;
	/** Second line, rendered only by the 'cards' variant. */
	description?: string;
	/** Trailing count, rendered only by the 'inline' variant. */
	count?: number;
	disabled?: boolean;
};

export type TableColumn = {
	label: string;
	align?: 'left' | 'center' | 'right';
	width?: string;
};


export type SelectOption = {
	value: string | number;
	label: string;
	/** Secondary line under the label, for descriptions. */
	hint?: string;
	/** Trailing value on the same line as the label, for counts. */
	meta?: string;
	iconSrc?: string;
	disabled?: boolean;
};

export interface ConfirmOptions {
	title?: string;
	description?: string;
	confirmLabel?: string;
	cancelLabel?: string;
	tone?: ConfirmTone;
}
