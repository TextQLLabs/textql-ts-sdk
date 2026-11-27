import { Check } from 'lucide-react';
import type { ReactNode } from 'react';

import { cx } from '../lib/cx';

export function inputClass(error: string | undefined): string {
	return cx(
		'w-full rounded-sm border bg-paper px-3 py-2 text-[13px] text-ink outline-none transition-colors placeholder:text-muted focus:border-accent',
		error ? 'border-red-500/70' : 'border-line'
	);
}

type FieldProps = {
	label: string;
	hint?: string;
	error?: string;
	/** Set when the child is a single input, so the label focuses it. */
	htmlFor?: string;
	badge?: ReactNode;
	children: ReactNode;
};

export function Field({ label, hint, error, htmlFor, badge, children }: FieldProps) {
	const labelClass = 'text-[12.5px] font-medium text-text-strong';
	return (
		<div className="flex min-w-0 flex-col gap-1.5">
			<div className="flex items-center gap-2">
				{htmlFor ? (
					<label htmlFor={htmlFor} className={labelClass}>
						{label}
					</label>
				) : (
					<span className={labelClass}>{label}</span>
				)}
				{badge}
			</div>
			{hint && <p className="m-0 text-[11.5px] leading-[1.4] text-muted">{hint}</p>}
			{children}
			{error && (
				<p role="alert" className="m-0 text-[11.5px] leading-[1.4] text-red-500">
					{error}
				</p>
			)}
		</div>
	);
}

export function SourceBadge({ children }: { children: ReactNode }) {
	return (
		<span className="rounded-xs bg-accent/10 px-1.5 py-px font-mono text-[10px] tracking-wide text-accent uppercase">
			{children}
		</span>
	);
}

type Choice<T> = { value: T; label: string; hint?: string };

type ChoiceGroupProps = {
	label: string;
	options: readonly Choice<string>[];
	value: string;
	onChange: (value: string) => void;
	columns?: 1 | 2 | 3;
	error?: string;
};

/** Single choice rendered as radio cards. */
export function ChoiceGroup({ label, options, value, onChange, columns = 1, error }: ChoiceGroupProps) {
	return (
		<div
			role="radiogroup"
			aria-label={label}
			className={cx(
				'grid gap-1.5',
				columns === 3
					? 'grid-cols-3 max-[560px]:grid-cols-1'
					: columns === 2
						? 'grid-cols-2 max-[560px]:grid-cols-1'
						: 'grid-cols-1'
			)}
		>
			{options.map((option) => {
				const selected = option.value === value;
				return (
					<button
						key={option.value}
						type="button"
						role="radio"
						aria-checked={selected}
						onClick={() => onChange(option.value)}
						className={cx(
							'flex cursor-pointer items-start gap-2.5 rounded-sm border px-3 py-2 text-left transition-colors',
							selected
								? 'border-accent bg-accent/8'
								: error
									? 'border-red-500/50 bg-paper hover:border-text-3'
									: 'border-line bg-paper hover:border-text-3'
						)}
					>
						<span
							className={cx(
								'mt-[3px] flex size-3.5 shrink-0 items-center justify-center rounded-full border',
								selected ? 'border-accent' : 'border-line'
							)}
						>
							{selected && <span className="size-1.5 rounded-full bg-accent" />}
						</span>
						<span className="flex min-w-0 flex-col gap-0.5">
							<span className="text-[12.5px] text-ink">{option.label}</span>
							{option.hint && (
								<span className="text-[11.5px] leading-[1.35] text-muted">{option.hint}</span>
							)}
						</span>
					</button>
				);
			})}
		</div>
	);
}

type ChipGroupProps<T extends string | number> = {
	label: string;
	options: readonly Choice<T>[];
	values: readonly T[];
	onToggle: (value: T) => void;
	error?: string;
};

/** Multiple choice rendered as toggle chips. */
export function ChipGroup<T extends string | number>({
	label,
	options,
	values,
	onToggle,
	error
}: ChipGroupProps<T>) {
	return (
		<div role="group" aria-label={label} className="flex flex-wrap gap-1.5">
			{options.map((option) => {
				const selected = values.includes(option.value);
				return (
					<button
						key={option.value}
						type="button"
						aria-pressed={selected}
						title={option.hint}
						onClick={() => onToggle(option.value)}
						className={cx(
							'inline-flex cursor-pointer items-center gap-1 rounded-xs border px-2.5 py-1 text-[12px] transition-colors',
							selected
								? 'border-accent bg-accent/10 text-accent'
								: error
									? 'border-red-500/50 bg-paper text-text-2 hover:border-text-3'
									: 'border-line bg-paper text-text-2 hover:border-text-3'
						)}
					>
						{selected && <Check size={12} strokeWidth={2} />}
						{option.label}
					</button>
				);
			})}
		</div>
	);
}
