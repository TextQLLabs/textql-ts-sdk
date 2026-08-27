import type { ReactNode } from 'react';

import type { IconComponent } from '../lib/cells';
import { CELL_BODY } from '../lib/cellText';
import { cx } from '../lib/cx';

/** The one error presentation for every cell surface — size, colour and wrapping. */
export function CellError({ message }: { message: string }) {
	return (
		<p className={cx(CELL_BODY, 'm-0 whitespace-pre-wrap text-danger wrap-anywhere')}>
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
	/** Header-right slot: view switchers, copy, show-all. Never body content. */
	actions?: ReactNode;
	/** Base typography only — chrome stays uniform across cells. */
	className?: string;
	children?: ReactNode;
};

/** The card every cell renders into: chrome, header, and the error slot. */
export function CellShell({
	icon: Icon,
	title,
	summary,
	error,
	actions,
	className,
	children
}: Props) {
	return (
		<div
			className={cx(
				'flex flex-col gap-1.5 rounded-sm border bg-elevate/55 px-3 py-2.5',
				error
					? 'border-[color-mix(in_srgb,var(--color-danger)_35%,var(--color-line))]'
					: 'border-line',
				className
			)}
		>
			{(title || actions) && (
				<div className="flex min-w-0 items-center gap-[7px] text-ink">
					{Icon && <Icon className="shrink-0 text-muted" size={14} />}
					{title && <span className={cx(CELL_BODY, 'shrink-0 font-semibold')}>{title}</span>}
					{summary && (
						<span className={cx(CELL_BODY, 'overflow-hidden text-ellipsis whitespace-nowrap text-muted')}>
							{summary}
						</span>
					)}
					{actions && (
						<div className="ml-auto flex min-w-0 items-center gap-1 pl-2">{actions}</div>
					)}
				</div>
			)}

			{error && <CellError message={error} />}

			{children}
		</div>
	);
}
