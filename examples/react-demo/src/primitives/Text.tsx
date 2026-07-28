import { useCallback, useEffect, useRef, useState, type HTMLAttributes, type ReactNode } from 'react';

import {
	SCRAMBLE_CHARS_FULL,
	SCRAMBLE_CHARS_PIXEL,
	textColorStyles,
	textDefaultStyles,
	textHiddenMeasureStyles,
	textLinkStyles,
	textSizeStyles,
	textTypeIsPixel,
	textTypeStyles,
	type TextColor,
	type TextSize,
	type TextType
} from './textStyles';
import './Text.css';

interface Props extends Omit<HTMLAttributes<HTMLParagraphElement>, 'color'> {
	size?: TextSize;
	color?: TextColor;
	children?: ReactNode;
	type?: TextType;
	animate?: boolean;
	/** Trigger scramble animation when element enters viewport */
	animateOnView?: boolean;
	animateOnHover?: boolean;
	animationSpeed?: number;
	/** Total animation duration in ms - overrides animationSpeed to ensure consistent timing regardless of text length */
	duration?: number;
	cyclesPerChar?: number;
	/** IntersectionObserver threshold for animateOnView (0-1) */
	viewThreshold?: number;
	/** Charset used while scrambling. Defaults to a pixel-safe set for heading/important, full set otherwise. */
	chars?: string;
	/** Animate a smooth blue underline on links inside the text. */
	links?: boolean;
}

export function Text({
	size = 'md',
	color = 'black',
	children,
	className,
	type = 'paragraph',
	animate = false,
	animateOnView = false,
	animateOnHover = false,
	animationSpeed = 15,
	duration = 800,
	cyclesPerChar = 3,
	viewThreshold = 0.1,
	chars,
	links = false,
	...rest
}: Props) {
	const charset = chars ?? (textTypeIsPixel[type] ? SCRAMBLE_CHARS_PIXEL : SCRAMBLE_CHARS_FULL);
	const scrambles = animate || animateOnView || animateOnHover;

	const [displayText, setDisplayText] = useState('');
	const [isAnimating, setIsAnimating] = useState(false);
	const hiddenRef = useRef<HTMLSpanElement | null>(null);
	const containerRef = useRef<HTMLParagraphElement | null>(null);
	const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

	const startAnimation = useCallback(() => {
		const text = hiddenRef.current?.textContent ?? '';
		if (!text) {
			setIsAnimating(false);
			return;
		}

		clearInterval(intervalRef.current);
		setIsAnimating(true);

		// Split charset by code point so multi-byte glyphs (CJK) are atomic.
		const glyphs = [...charset];
		const randomChar = () => glyphs[Math.floor(Math.random() * glyphs.length)];
		const isStable = (ch: string) => ch === ' ' || ch === '\n' || ch === '\t';

		// Split by code point so CJK / multi-byte glyphs resolve as one unit.
		const target = [...text];

		// Everything from `index` onward is still scrambling (spaces pass through).
		const scrambleFrom = (start: number) =>
			target
				.slice(start)
				.map((ch) => (isStable(ch) ? ch : randomChar()))
				.join('');

		const nonSpace = target.filter((ch) => !isStable(ch)).length || 1;
		const totalTicks = nonSpace * (cyclesPerChar + 1);
		const speed = duration ? Math.max(1, Math.floor(duration / totalTicks)) : animationSpeed;

		let index = 0; // next position to lock — reveals left → right
		let cycle = 0;

		setDisplayText(scrambleFrom(0)); // initial fully-scrambled frame

		intervalRef.current = setInterval(() => {
			// skip spaces/newlines instantly
			while (index < target.length && isStable(target[index]!)) index++;

			if (index >= target.length) {
				setDisplayText(text);
				clearInterval(intervalRef.current);
				setIsAnimating(false);
				return;
			}

			const locked = target.slice(0, index).join('');

			if (cycle < cyclesPerChar) {
				// current slot flickers through random glyphs before settling
				setDisplayText(locked + randomChar() + scrambleFrom(index + 1));
				cycle++;
			} else {
				index++; // lock the current character
				cycle = 0;
				setDisplayText(target.slice(0, index).join('') + scrambleFrom(index));
			}
		}, speed);
	}, [animationSpeed, charset, cyclesPerChar, duration]);

	useEffect(() => {
		if (animate) startAnimation();

		let observer: IntersectionObserver | undefined;
		if (animateOnView && containerRef.current) {
			observer = new IntersectionObserver(
				(entries) => {
					entries.forEach((entry) => {
						if (entry.isIntersecting) {
							startAnimation();
							observer?.unobserve(entry.target);
						}
					});
				},
				{ threshold: viewThreshold }
			);
			observer.observe(containerRef.current);
		}

		return () => {
			clearInterval(intervalRef.current);
			observer?.disconnect();
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only, mirroring Svelte's onMount
	}, []);

	const handleMouseEnter = () => {
		if (animateOnHover) startAnimation();
	};

	return (
		<>
			{scrambles && (
				<span
					ref={hiddenRef}
					aria-hidden="true"
					className={`${textSizeStyles[size]} ${textTypeStyles[type]} ${textHiddenMeasureStyles}`}
				>
					{children}
				</span>
			)}

			<p
				ref={containerRef}
				className={`${textSizeStyles[size]} ${textColorStyles[color]} ${textDefaultStyles} ${textTypeStyles[type]} ${links ? textLinkStyles : ''} ${className ?? ''}`}
				onMouseEnter={handleMouseEnter}
				{...rest}
			>
				{isAnimating ? displayText : children}
			</p>
		</>
	);
}
