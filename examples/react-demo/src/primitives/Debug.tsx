import { useState } from 'react';

import { debugStore } from '../lib/debugStore';
import { Button } from './Button';

/** Read the initial division count from `?debug=<n>`; anything non-numeric means 8. */
function initialDivisions(): number {
	const params = new URLSearchParams(typeof window === 'undefined' ? '' : window.location.search);
	const debugParam = params.get('debug');
	if (debugParam && debugParam !== 'true' && !isNaN(Number(debugParam))) {
		return Number(debugParam);
	}
	return 8;
}

const writeDebugParam = (value: string | null) => {
	if (typeof window === 'undefined') return;
	const url = new URL(window.location.href);
	if (value === null) url.searchParams.delete('debug');
	else url.searchParams.set('debug', value);
	history.replaceState({}, '', url.toString());
};

export function Debug() {
	const [divisions, setDivisions] = useState(initialDivisions);

	const chooseDivisions = (n: number) => {
		setDivisions(n);
		writeDebugParam(String(n));
	};

	const close = () => {
		writeDebugParam(null);
		debugStore.setEnabled(false);
	};

	return (
		<>
			{/* Grid overlay */}
			<div className="pointer-events-none fixed inset-0 z-50 flex">
				{Array.from({ length: divisions - 1 }, (_, i) => i + 1).map((i) => (
					<div
						key={i}
						className="absolute top-0 h-full w-px bg-accent/30"
						style={{ left: `${(i / divisions) * 100}%` }}
					/>
				))}
			</div>

			{/* Toggle panel */}
			<div className="fixed top-4 right-4 z-50 flex items-center gap-2 rounded-sm border border-line bg-paper p-2 shadow-sm">
				<span className="font-mono text-xs text-muted">grid</span>
				{[4, 8, 16].map((n) => (
					<Button
						key={n}
						size="sm"
						variant={divisions === n ? 'solid' : 'ghost'}
						onClick={() => chooseDivisions(n)}
					>
						{n}
					</Button>
				))}
				<Button size="sm" variant="ghost" aria-label="Close debug grid" onClick={close}>
					×
				</Button>
			</div>
		</>
	);
}
