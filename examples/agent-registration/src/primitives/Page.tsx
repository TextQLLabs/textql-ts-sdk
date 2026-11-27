import type { ReactNode } from 'react';

import { cx } from '../lib/cx';

type Props = {
	title: string;
	lead?: string;
	actions?: ReactNode;
	children?: ReactNode;
	/** Full-width body (no 840px column). Header is always full-bleed. */
	wide?: boolean;
	className?: string;
	/** Class applied to the header actions row — lets a page stretch/justify it. */
	actionsClassName?: string;
};

export function Page({
	title,
	lead,
	actions,
	children,
	wide = false,
	className,
	actionsClassName
}: Props) {
	return (
		// `page` stays unhashed so host layouts (ChatPage) can size it via a global rule.
		<div
			className={cx(
				'page flex h-full min-h-full w-full flex-col bg-paper font-sans text-ink',
				className
			)}
		>
			<header className="shrink-0 border-b border-line/80 bg-[color-mix(in_srgb,var(--color-paper)_92%,var(--color-elevate))]">
				<div className="flex min-h-10 w-full items-center justify-between gap-2.5 px-4 py-2 max-[560px]:px-3">
					<div className="flex min-w-0 flex-col gap-px">
						<h1 className="m-0 text-[13.5px] leading-tight font-semibold -tracking-[0.01em] text-ink">
							{title}
						</h1>
						{lead && <p className="m-0 text-[11.5px] leading-[1.3] text-muted">{lead}</p>}
					</div>
					{actions && (
						<div className={cx('flex shrink-0 items-center gap-1.5', actionsClassName)}>{actions}</div>
					)}
				</div>
			</header>

			{/* The narrow-screen inset only applies to the centred column: in the
			    original CSS `.page.wide .body` outranks the `@media` rule, so wide
			    pages keep their 16px gutter all the way down. */}
			<div
				className={cx(
					'flex min-h-0 flex-1 flex-col',
					wide
						? 'w-full max-w-none px-4 pt-4 pb-6'
						: 'mx-auto w-[min(840px,100%)] px-5 pt-7 pb-12 max-[560px]:px-3.5'
				)}
			>
				{children}
			</div>
		</div>
	);
}
