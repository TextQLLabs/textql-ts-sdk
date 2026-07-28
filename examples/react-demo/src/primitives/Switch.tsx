import type { ButtonHTMLAttributes } from 'react';

interface Props extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
	/** On/off state. */
	checked?: boolean;
	/** Called with the new state when toggled. */
	onCheckedChange?: (checked: boolean) => void;
}

/**
 * Squared switch in the editorial palette: paper track + ink thumb that
 * inverts to an accent track + paper thumb when on.
 */
export function Switch({
	checked = false,
	onCheckedChange,
	disabled = false,
	className,
	...rest
}: Props) {
	function toggle() {
		if (disabled) return;
		onCheckedChange?.(!checked);
	}

	return (
		<button
			{...rest}
			type="button"
			role="switch"
			aria-checked={checked}
			disabled={disabled}
			data-checked={checked ? '' : undefined}
			onClick={toggle}
			className={`inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border border-line bg-paper p-0.5 outline-none transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-default disabled:opacity-40 data-[checked]:border-accent data-[checked]:bg-accent ${className ?? ''}`}
		>
			<span
				data-checked={checked ? '' : undefined}
				className="size-3.5 rounded-full bg-ink transition-[translate,background-color] duration-150 data-[checked]:translate-x-[18px] data-[checked]:bg-paper"
			/>
		</button>
	);
}
