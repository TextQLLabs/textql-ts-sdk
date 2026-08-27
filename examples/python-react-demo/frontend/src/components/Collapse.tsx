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

	// `rendered` is a dependency because opening is two renders: the first only
	// flips `rendered`, so the element does not exist yet and there is nothing to
	// measure. Without it the effect never re-runs against the mounted node and
	// the body just appears at full height.
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
		const collapsed = {
			height: '0px',
			opacity: 0,
			paddingTop: '0px',
			paddingBottom: '0px'
		};
		const expanded = {
			height: `${el.scrollHeight}px`,
			opacity: 1,
			paddingTop: style.paddingTop,
			paddingBottom: style.paddingBottom
		};

		el.style.overflow = 'hidden';
		const animation = el.animate(open ? [collapsed, expanded] : [expanded, collapsed], {
			duration,
			easing: 'cubic-bezier(0.33, 1, 0.68, 1)',
			// Without a forwards fill the element reverts to its base style the
			// instant the animation ends, so a closing body snaps back to full
			// height for one frame before React unmounts it — a visible flash.
			fill: 'forwards'
		});

		let superseded = false;
		animation.finished
			.then(() => {
				if (superseded) return;
				if (!open) {
					setRendered(false);
					return;
				}
				// Drop the fill once open, or the body would stay pinned to the height
				// it had when it opened and clip whatever streams in after.
				animation.cancel();
				el.style.overflow = '';
			})
			.catch(() => {
				/* superseded by a newer toggle */
			});

		return () => {
			superseded = true;
			animation.cancel();
		};
	}, [open, rendered, duration]);

	if (!rendered) return null;

	return (
		<div ref={ref} className={className}>
			{children}
		</div>
	);
}
