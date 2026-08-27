import type { ReactNode } from 'react';

import { Button } from './Button';
import { Modal } from './Modal';
import type { ConfirmTone } from './modalTypes';

type Props = {
	open?: boolean;
	title?: string;
	/** Message body. Ignored if `children` is provided. */
	description?: string;
	/** Rich body content; overrides `description`. */
	children?: ReactNode;
	confirmLabel?: string;
	cancelLabel?: string;
	/**
	 * Visual class of the dialog. `danger` for destructive actions (deletes),
	 * `warning` for risky-but-reversible, `info`/`neutral` for plain confirms.
	 */
	tone?: ConfirmTone;
	/**
	 * Show a busy state on the confirm button and block dismissal — set this
	 * while an async `onConfirm` is in flight. The dialog does NOT close itself
	 * on confirm, so the caller controls closing after the work completes.
	 */
	loading?: boolean;
	onOpenChange?: (open: boolean) => void;
	/** Fired when the primary action is pressed. May be async. */
	onConfirm?: () => void;
	/** Fired on cancel, backdrop, or Escape. Dialog closes itself first. */
	onCancel?: () => void;
};

const toneAccent: Record<ConfirmTone, string> = {
	danger: 'bg-red-500/12 text-red-600',
	warning: 'bg-amber-500/12 text-amber-600',
	info: 'bg-accent/12 text-accent',
	neutral: 'bg-line/60 text-muted'
};

export function Confirm({
	open = false,
	title = 'Are you sure?',
	description,
	children,
	confirmLabel = 'Confirm',
	cancelLabel = 'Cancel',
	tone = 'info',
	loading = false,
	onOpenChange,
	onConfirm,
	onCancel
}: Props) {
	const confirmVariant = tone === 'danger' ? 'danger' : 'solid';

	function cancel() {
		if (loading) return;
		onOpenChange?.(false);
		onCancel?.();
	}

	return (
		<Modal
			open={open}
			title={title}
			dismissable={!loading}
			onOpenChange={onOpenChange}
			onClose={onCancel}
			actions={
				<>
					<Button variant="ghost" disabled={loading} onClick={cancel}>
						{cancelLabel}
					</Button>
					<Button variant={confirmVariant} disabled={loading} onClick={onConfirm}>
						{loading ? 'Working…' : confirmLabel}
					</Button>
				</>
			}
		>
			<div className="flex items-start gap-3">
				<span
					className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full ${toneAccent[tone]}`}
					aria-hidden="true"
				>
					{tone === 'danger' || tone === 'warning' ? (
						// alert triangle
						<svg
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
							className="size-4"
						>
							<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
							<line x1="12" y1="9" x2="12" y2="13" />
							<line x1="12" y1="17" x2="12.01" y2="17" />
						</svg>
					) : (
						// info circle
						<svg
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
							className="size-4"
						>
							<circle cx="12" cy="12" r="10" />
							<line x1="12" y1="16" x2="12" y2="12" />
							<line x1="12" y1="8" x2="12.01" y2="8" />
						</svg>
					)}
				</span>
				<div className="min-w-0 flex-1">{children ?? (description ? <p>{description}</p> : null)}</div>
			</div>
		</Modal>
	);
}
