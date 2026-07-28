import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';

import { prefersReducedMotion } from '../lib/utils';

type Props = {
	open: boolean;
	duration?: number;
	className?: string;
	children: ReactNode;
};

/**
 * Height + opacity reveal so expand/collapse feels soft, not a hard cut — the
 * React equivalent of the Svelte demo's `softSlide` transition (including its
 * exit animation, which is why children stay mounted until it finishes).
 */
export function Collapse({ open, duration = 220, className, children }: Props) {
	const [rendered, setRendered] = useState(open);
	const ref = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		if (open) setRendered(true);
	}, [open]);

	useLayoutEffect(() => {
		const el = ref.current;
		// Nothing to animate when collapsing an already-unmounted body.
		if (!el) {
			if (!open) setRendered(false);
			return;
		}
		if (prefersReducedMotion()) {
			if (!open) setRendered(false);
			return;
		}

		const style = getComputedStyle(el);
		const height = el.scrollHeight;
		const paddingTop = parseFloat(style.paddingTop) || 0;
		const paddingBottom = parseFloat(style.paddingBottom) || 0;
		const collapsed = {
			height: '0px',
			opacity: 0,
			paddingTop: '0px',
			paddingBottom: '0px'
		};
		const expanded = {
			height: `${height}px`,
			opacity: 1,
			paddingTop: `${paddingTop}px`,
			paddingBottom: `${paddingBottom}px`
		};

		el.style.overflow = 'hidden';
		const animation = el.animate(open ? [collapsed, expanded] : [expanded, collapsed], {
			duration,
			easing: 'cubic-bezier(0.33, 1, 0.68, 1)'
		});

		animation.finished
			.then(() => {
				if (open) el.style.overflow = '';
				else setRendered(false);
			})
			.catch(() => {
				/* superseded by a newer toggle */
			});

		return () => animation.cancel();
	}, [open, duration]);

	if (!rendered) return null;

	return (
		<div ref={ref} className={className}>
			{children}
		</div>
	);
}
