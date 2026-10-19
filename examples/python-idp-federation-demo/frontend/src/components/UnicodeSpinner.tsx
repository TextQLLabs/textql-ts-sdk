import { useEffect, useState } from 'react';
import spinners, { type BrailleSpinnerName } from 'unicode-animations';

import { cx } from '../lib/cx';
import { prefersReducedMotion } from '../lib/utils';

const spinnerNames = Object.keys(spinners) as BrailleSpinnerName[];

function randomSpinnerName(): BrailleSpinnerName {
	return spinnerNames[Math.floor(Math.random() * spinnerNames.length)]!;
}

type Props = {
	label?: string;
	className?: string;
};

export function UnicodeSpinner({ label = 'Loading', className = '' }: Props) {
	const [name, setName] = useState<BrailleSpinnerName>('braille');
	const [frame, setFrame] = useState(0);
	const [ready, setReady] = useState(false);

	useEffect(() => {
		const resolved = randomSpinnerName();
		setName(resolved);
		setReady(true);

		const { frames, interval } = spinners[resolved];
		setFrame(0);

		if (prefersReducedMotion() || frames.length === 0) return;

		const timer = setInterval(() => {
			setFrame((current) => (current + 1) % frames.length);
		}, interval);

		return () => clearInterval(timer);
	}, []);

	const spinner = spinners[name];

	return (
		<span
			// Braille frames need the system mono stack, not the theme's display mono.
			className={cx(
				'inline-block select-none font-[ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace] text-xs leading-none text-muted',
				className
			)}
			role="status"
			aria-label={label}
			aria-live="polite"
		>
			<span aria-hidden="true">{ready ? (spinner.frames[frame] ?? '') : ''}</span>
		</span>
	);
}
