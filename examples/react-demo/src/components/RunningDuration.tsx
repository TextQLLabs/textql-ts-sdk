import { useEffect, useRef, useState } from 'react';

import { formatElapsed } from '../lib/cells';

type Props = {
	/** API timestamp in ms, or null to start the clock on mount. */
	startedAtMs?: number | null;
};

export function RunningDuration({ startedAtMs = null }: Props) {
	const mountMsRef = useRef(Date.now());
	const [now, setNow] = useState(() => Date.now());

	useEffect(() => {
		setNow(Date.now());
		const id = setInterval(() => setNow(Date.now()), 1000);
		return () => clearInterval(id);
	}, []);

	const label = `Running ${formatElapsed(now - (startedAtMs ?? mountMsRef.current))}`;

	return (
		<span
			className="shrink-0 whitespace-nowrap text-[11.5px] font-medium tracking-[0.01em] tabular-nums text-[#a1a1aa]"
			aria-live="polite"
		>
			{label}
		</span>
	);
}
