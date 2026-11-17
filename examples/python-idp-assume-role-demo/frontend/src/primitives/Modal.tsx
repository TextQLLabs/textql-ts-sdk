import type { ReactNode } from 'react';

import { useDismissable } from '../lib/useDismissable';

type Props = {
	open?: boolean;
	title?: string;
	children?: ReactNode;
	/**
	 * Footer buttons. Convention: pass the dismiss/secondary button FIRST and
	 * the primary action LAST — the row is right-aligned, so the primary action
	 * sits on the right and the dismiss to its left.
	 */
	actions?: ReactNode;
	/** Called when dismissed via backdrop or Escape (not on programmatic close). */
	onClose?: () => void;
	/** `full` fills the window and renders children raw, for a dialog that is
	 *  its own layout; `title` then only names it for assistive tech. */
	size?: 'sm' | 'full';
};

const PANEL =
	'relative z-10 animate-modal-reveal rounded-lg border border-line bg-paper shadow-[0_20px_60px_-12px_rgba(15,15,20,0.18)] [will-change:transform,opacity] motion-reduce:animate-none';

export function Modal({ open = false, title, children, actions, onClose, size = 'sm' }: Props) {
	useDismissable(open, () => onClose?.());

	if (!open) return null;
	const full = size === 'full';

	return (
		<div
			className={`fixed inset-0 z-[100] flex items-center justify-center ${full ? 'p-8' : 'p-4'}`}
			role="dialog"
			aria-modal="true"
			aria-label={title}
		>
			<button
				type="button"
				className="absolute inset-0 animate-modal-fade cursor-default border-0 bg-ink/40 p-0 backdrop-blur-xs motion-reduce:animate-none"
				onClick={() => onClose?.()}
				aria-label="Close"
				tabIndex={-1}
			/>

			{full ? (
				<div className={`${PANEL} flex h-full w-full flex-col overflow-hidden`}>{children}</div>
			) : (
				<div className={`${PANEL} w-full max-w-xs px-4 py-3`}>
					{title && (
						<h2 className="font-sans text-base font-medium leading-tight text-ink">{title}</h2>
					)}
					{children && (
						<div className="mt-1.5 font-sans text-sm leading-relaxed text-muted">{children}</div>
					)}
					{actions && <div className="mt-4 flex justify-end gap-2">{actions}</div>}
				</div>
			)}
		</div>
	);
}
