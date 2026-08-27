import { useEffect, useRef } from 'react';

type Options = {
	/**
	 * Whether the pointer event landed inside the surface. Omit for a
	 * keyboard-only dismiss (a modal with its own backdrop, say) — no
	 * `pointerdown` listener is registered without it.
	 */
	contains?: (target: EventTarget | null) => boolean;
	/** Return true to keep the surface open, e.g. to close a nested layer first. */
	onEscape?: (event: KeyboardEvent) => boolean | void;
};

/**
 * Close on Escape, and on a pointer press outside the surface. Callbacks are
 * read through a ref so the listeners are attached once per open rather than
 * re-attached on every render of the host.
 */
export function useDismissable(open: boolean, onDismiss: () => void, options: Options = {}): void {
	const latest = useRef({ onDismiss, ...options });
	latest.current = { onDismiss, ...options };

	const watchPointer = options.contains !== undefined;

	useEffect(() => {
		if (!open) return;

		const onKeydown = (event: KeyboardEvent) => {
			if (event.key !== 'Escape') return;
			if (latest.current.onEscape?.(event) === true) return;
			latest.current.onDismiss();
		};
		const onPointerDown = (event: PointerEvent) => {
			if (latest.current.contains?.(event.target) === true) return;
			latest.current.onDismiss();
		};

		window.addEventListener('keydown', onKeydown);
		if (watchPointer) window.addEventListener('pointerdown', onPointerDown);
		return () => {
			window.removeEventListener('keydown', onKeydown);
			window.removeEventListener('pointerdown', onPointerDown);
		};
	}, [open, watchPointer]);
}
