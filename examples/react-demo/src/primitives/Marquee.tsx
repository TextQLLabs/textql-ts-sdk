import { useEffect, useRef, useState } from 'react';

type Props = {
	text: string;
	className?: string;
	/** scroll speed in px/second */
	speed?: number;
	/** px between the repeated copies */
	gap?: number;
	/** centre the text when it fits (still scrolls left when it overflows) */
	center?: boolean;
};

export function Marquee({ text, className = '', speed = 40, gap = 32, center = false }: Props) {
	const outerRef = useRef<HTMLDivElement | null>(null);
	const firstRef = useRef<HTMLSpanElement | null>(null);
	const [scroll, setScroll] = useState(false);

	const reduced =
		typeof window !== 'undefined' &&
		(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);

	useEffect(() => {
		if (reduced) return;
		const outer = outerRef.current;
		const first = firstRef.current;
		if (!outer || !first) return;

		let anim: Animation | null = null;

		const measure = () => {
			anim?.cancel();
			anim = null;
			const over = first.scrollWidth > outer.clientWidth + 1;
			setScroll(over);
			if (!over) return;
			const shift = first.scrollWidth + gap;
			const track = first.parentElement as HTMLElement | null;
			if (!track) return;
			anim = track.animate(
				[{ transform: 'translateX(0)' }, { transform: `translateX(${-shift}px)` }],
				{ duration: (shift / speed) * 1000, iterations: Infinity, easing: 'linear' }
			);
		};

		measure();
		const ro = new ResizeObserver(measure);
		ro.observe(outer);
		return () => {
			ro.disconnect();
			anim?.cancel();
		};
		// Re-measure whenever any of these change, matching the Svelte $effect deps.
	}, [text, gap, speed, reduced, scroll]);

	return (
		<div ref={outerRef} className={`overflow-hidden ${className}`}>
			{/* w-max keeps the track at content width for the scroll animation; when it
			    fits and `center` is set, go full-width + justify-center to centre it. */}
			<div
				className={`flex whitespace-nowrap ${center && !scroll ? 'w-full justify-center' : 'w-max'}`}
				style={{ gap: `${gap}px` }}
			>
				<span ref={firstRef}>{text}</span>
				{scroll && <span aria-hidden="true">{text}</span>}
			</div>
		</div>
	);
}
