import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

import { cx } from '../lib/cx';

type Side = 'top' | 'bottom' | 'left' | 'right';

type Props = {
	label: string;
	side?: Side;
	children: ReactNode;
};

const GAP = 6;

/**
 * Centering rides on the `translate` property so the reveal keyframe owns
 * `transform`; the two compose cleanly. `--tooltip-dx/dy` feed the keyframe.
 */
const SIDE_CLASS: Record<Side, string> = {
	bottom: '-translate-x-1/2 [--tooltip-dx:0px] [--tooltip-dy:-5px]',
	top: '-translate-x-1/2 -translate-y-full [--tooltip-dx:0px] [--tooltip-dy:5px]',
	right: '-translate-y-1/2 [--tooltip-dx:-5px] [--tooltip-dy:0px]',
	left: '-translate-x-full -translate-y-1/2 [--tooltip-dx:5px] [--tooltip-dy:0px]'
};

export function Tooltip({ label, side = 'bottom', children }: Props) {
	const wrapRef = useRef<HTMLSpanElement | null>(null);
	const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
	const [open, setOpen] = useState(false);
	const [point, setPoint] = useState({ x: 0, y: 0 });

	useEffect(() => () => clearTimeout(timerRef.current), []);

	function show() {
		const wrap = wrapRef.current;
		const el = wrap?.firstElementChild ?? wrap;
		if (!el) return;
		const r = el.getBoundingClientRect();
		if (side === 'bottom') setPoint({ x: r.left + r.width / 2, y: r.bottom + GAP });
		else if (side === 'top') setPoint({ x: r.left + r.width / 2, y: r.top - GAP });
		else if (side === 'right') setPoint({ x: r.right + GAP, y: r.top + r.height / 2 });
		else setPoint({ x: r.left - GAP, y: r.top + r.height / 2 });
		clearTimeout(timerRef.current);
		timerRef.current = setTimeout(() => setOpen(true), 300);
	}

	function hide() {
		clearTimeout(timerRef.current);
		setOpen(false);
	}

	return (
		<>
			<span
				className="inline-flex"
				ref={wrapRef}
				onPointerEnter={show}
				onPointerLeave={hide}
				onFocus={show}
				onBlur={hide}
			>
				{children}
			</span>

			{open &&
				createPortal(
					<span
						className={cx(
							'pointer-events-none fixed z-[1000] inline-flex animate-tooltip-reveal items-center gap-[0.35rem] rounded-xs bg-ink px-[0.45rem] py-[0.22rem] text-[11.5px] leading-[1.2] whitespace-nowrap text-paper shadow-[0_4px_12px_rgb(0_0_0/0.16)] [will-change:transform,opacity] motion-reduce:animate-none motion-reduce:[will-change:auto]',
							SIDE_CLASS[side]
						)}
						role="tooltip"
						style={{ left: `${point.x}px`, top: `${point.y}px` }}
					>
						{label}
					</span>,
					document.body
				)}
		</>
	);
}
