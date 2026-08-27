import type { ReactNode } from 'react';

type Props = {
	title: string;
	lead?: string;
	actions?: ReactNode;
	children?: ReactNode;
};

export function Page({ title, lead, actions, children }: Props) {
	return (
		// `page` stays unhashed so host layouts (ChatPage) can size it via a global rule.
		<div className="page flex h-full min-h-full w-full flex-col bg-paper font-sans text-ink">
			<header className="shrink-0 border-b border-line/80 bg-[color-mix(in_srgb,var(--color-paper)_92%,var(--color-elevate))]">
				<div className="flex min-h-10 w-full items-center justify-between gap-2.5 px-4 py-2 max-[560px]:px-3">
					<div className="flex min-w-0 flex-col gap-px">
						<h1 className="m-0 text-[13.5px] leading-tight font-semibold -tracking-[0.01em] text-ink">
							{title}
						</h1>
						{lead && <p className="m-0 text-[11.5px] leading-[1.3] text-muted">{lead}</p>}
					</div>
					{actions && <div className="flex shrink-0 items-center gap-1.5">{actions}</div>}
				</div>
			</header>

			<div className="flex min-h-0 w-full max-w-none flex-1 flex-col px-4 pt-4 pb-6">{children}</div>
		</div>
	);
}
