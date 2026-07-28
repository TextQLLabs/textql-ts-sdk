import { useEffect, type ReactNode } from 'react';

type Props = {
	open?: boolean;
	title?: string;
	/** Body content. */
	children?: ReactNode;
	/**
	 * Footer buttons. Convention: pass the dismiss/secondary button FIRST and
	 * the primary action LAST — the row is right-aligned, so the primary action
	 * sits on the right and the dismiss to its left.
	 */
	actions?: ReactNode;
	/** Called when dismissed via backdrop or Escape (not on programmatic close). */
	onClose?: () => void;
	/** Toggle the bindable open state (Svelte's `bind:open` equivalent). */
	onOpenChange?: (open: boolean) => void;
	/** Allow clicking the backdrop to dismiss. */
	dismissable?: boolean;
};

export function Modal({
	open = false,
	title,
	children,
	actions,
	onClose,
	onOpenChange,
	dismissable = true
}: Props) {
	useEffect(() => {
		if (!open || !dismissable) return;
		const onKeydown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				onOpenChange?.(false);
				onClose?.();
			}
		};
		window.addEventListener('keydown', onKeydown);
		return () => window.removeEventListener('keydown', onKeydown);
	}, [open, dismissable, onClose, onOpenChange]);

	if (!open) return null;

	const dismiss = () => {
		onOpenChange?.(false);
		onClose?.();
	};

	return (
		<div
			className="fixed inset-0 z-[100] flex items-center justify-center p-4"
			role="dialog"
			aria-modal="true"
			aria-label={title}
		>
			<button
				type="button"
				className="absolute inset-0 animate-modal-fade cursor-default border-0 bg-ink/40 p-0 backdrop-blur-xs motion-reduce:animate-none"
				onClick={() => dismissable && dismiss()}
				aria-label="Close"
				tabIndex={-1}
			/>

			<div className="relative z-10 w-full max-w-xs animate-modal-reveal rounded-lg border border-line bg-paper px-4 py-3 shadow-[0_20px_60px_-12px_rgba(15,15,20,0.18)] [will-change:transform,opacity] motion-reduce:animate-none">
				{title && (
					<h2 className="font-sans text-base font-medium leading-tight text-ink">{title}</h2>
				)}
				{children && (
					<div className="mt-1.5 font-sans text-sm leading-relaxed text-muted">{children}</div>
				)}
				{actions && (
					// Right-aligned: dismiss (first) on the left, primary action (last)
					// on the right.
					<div className="mt-4 flex justify-end gap-2">{actions}</div>
				)}
			</div>
		</div>
	);
}
