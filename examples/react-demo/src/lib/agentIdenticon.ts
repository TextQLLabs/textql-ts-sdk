// Deterministic default avatars for agents — a GitHub-style identicon derived
// from a stable seed (prefer the agent id so the icon survives renames).
// Ported from the main app's `agentIdenticon` utility.

type CanvasColors = { bg: string; fg: string };

// Canvas-friendly bg/fg pairs, one slot per palette index.
const CANVAS_PALETTE: CanvasColors[] = [
	{ bg: '#dbeafe', fg: '#2563eb' }, // blue
	{ bg: '#ede9fe', fg: '#7c3aed' }, // violet
	{ bg: '#fef3c7', fg: '#d97706' }, // amber
	{ bg: '#ffe4e6', fg: '#e11d48' }, // rose
	{ bg: '#ccfbf1', fg: '#0d9488' }, // teal
	{ bg: '#ffedd5', fg: '#ea580c' }, // orange
	{ bg: '#cffafe', fg: '#0891b2' }, // cyan
	{ bg: '#fce7f3', fg: '#db2777' } // pink
];

const GRAY_PALETTE: CanvasColors = { bg: '#f3f4f6', fg: '#9ca3af' };

/** FNV-1a hash of a string → normalised [0, 1). */
export function fnvHash(s: string): number {
	let h = 0x811c9dc5;
	for (let i = 0; i < s.length; i++) {
		h ^= s.charCodeAt(i);
		h = Math.imul(h, 0x01000193);
	}
	return ((h >>> 0) % 1_000_000) / 1_000_000;
}

/** Seeded xorshift32 PRNG. Call the returned fn repeatedly for a stream. */
export function seededRng(seed: number): () => number {
	let s = seed | 0 || 1;
	return () => {
		s ^= s << 13;
		s ^= s >> 17;
		s ^= s << 5;
		return ((s >>> 0) % 1_000_000) / 1_000_000;
	};
}

/**
 * 5×5 vertically-symmetric boolean grid: only the left 3 columns are random,
 * the right 2 mirror them. The mirroring is what makes it read as an emblem.
 */
export function getIdenticonCells(seed: string): boolean[][] {
	const rng = seededRng(Math.floor(fnvHash(seed) * 2 ** 32));
	const grid: boolean[][] = [];
	for (let row = 0; row < 5; row++) {
		const cols: boolean[] = [];
		for (let col = 0; col < 5; col++) {
			if (col <= 2) cols.push(rng() > 0.45);
			else cols.push(cols[4 - col]);
		}
		grid.push(cols);
	}
	return grid;
}

function paletteIndex(seed: string): number {
	let hash = 0;
	for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
	return hash % CANVAS_PALETTE.length;
}

/** Canvas bg/fg colours for the identicon. Gray when the agent is inactive. */
export function getIdenticonPalette(seed: string, isActive: boolean): CanvasColors {
	return isActive ? CANVAS_PALETTE[paletteIndex(seed)] : GRAY_PALETTE;
}
