import type { ReactNode } from 'react';

import type { IconComponent } from '../lib/cells';
import { cx } from '../lib/cx';

/** The one error presentation for every cell surface — size, colour and wrapping. */
export function CellError({ message }: { message: string }) {
	return (
		<p className="m-0 text-[12.5px] leading-[1.5] whitespace-pre-wrap text-danger wrap-anywhere">
			{message}
		</p>
	);
}

type Props = {
	icon?: IconComponent;
	/** Omitted for cells that own their heading, which drops the header row. */
	title?: string;
	summary?: string | null;
	error?: string | null;
	children?: ReactNode;
};

/** The card every cell renders into: chrome, header, and the error slot. */
export function CellShell({ icon: Icon, title, summary, error, children }: Props) {
	return (
		<div
			className={cx(
				'flex flex-col gap-1.5 rounded-sm border bg-elevate/55 px-3 py-2.5',
				error
					? 'border-[color-mix(in_srgb,var(--color-danger)_35%,var(--color-line))]'
					: 'border-line'
			)}
		>
			{title && (
				<div className="flex min-w-0 items-center gap-[7px] text-ink">
					{Icon && <Icon className="shrink-0 text-muted" size={14} />}
					<span className="shrink-0 text-[12.5px] font-semibold">{title}</span>
					{summary && (
						<span className="overflow-hidden text-[12.5px] text-ellipsis whitespace-nowrap text-muted">
							{summary}
						</span>
					)}
				</div>
			)}

			{error && <CellError message={error} />}

			{children}
		</div>
	);
}
