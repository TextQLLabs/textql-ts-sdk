import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'solid' | 'ghost';

type Props = {
	variant?: Variant;
	disabled?: boolean;
	className?: string;
	children?: ReactNode;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'>;

const base =
	'inline-flex select-none items-center justify-center gap-1.5 rounded-md px-3 py-1.5 font-sans text-xs whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50';

const variants: Record<Variant, string> = {
	solid: 'bg-accent text-paper hover:opacity-90',
	ghost: 'text-muted hover:bg-line/40 hover:text-accent'
};

export function Button({
	variant = 'solid',
	disabled = false,
	className = '',
	children,
	...rest
}: Props) {
	return (
		<button
			type="button"
			disabled={disabled}
			className={`${base} ${variants[variant]} ${className}`}
			{...rest}
		>
			{children}
		</button>
	);
}
