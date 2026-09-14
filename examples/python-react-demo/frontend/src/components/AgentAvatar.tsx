import { useState } from 'react';

// Matches the main app's agentIdenticon palette and stable agent-ID seed.
const PALETTE = [
	['#dbeafe', '#2563eb'],
	['#ede9fe', '#7c3aed'],
	['#fef3c7', '#d97706'],
	['#ffe4e6', '#e11d48'],
	['#ccfbf1', '#0d9488'],
	['#ffedd5', '#ea580c'],
	['#cffafe', '#0891b2'],
	['#fce7f3', '#db2777']
];

export function AgentAvatar({
	name,
	agentId,
	imageUrl
}: {
	name: string;
	agentId?: string | null;
	imageUrl?: string | null;
}) {
	const [failedUrl, setFailedUrl] = useState<string | null>(null);
	if (imageUrl && imageUrl !== failedUrl) {
		return (
			<img
				src={imageUrl}
				alt={`${name} profile picture`}
				className="size-7 shrink-0 rounded-md object-cover"
				referrerPolicy="no-referrer"
				onError={() => setFailedUrl(imageUrl)}
			/>
		);
	}
	const seed = agentId || name;
	let hash = 0x811c9dc5;
	let colorHash = 0;
	for (let i = 0; i < seed.length; i++) {
		hash = Math.imul(hash ^ seed.charCodeAt(i), 0x01000193);
		colorHash = (colorHash * 31 + seed.charCodeAt(i)) >>> 0;
	}
	let state = Math.floor((((hash >>> 0) % 1_000_000) / 1_000_000) * 2 ** 32) | 0 || 1;
	const cells: boolean[][] = [];
	for (let row = 0; row < 5; row++) {
		const cols: boolean[] = [];
		for (let col = 0; col < 5; col++) {
			if (col > 2) cols.push(cols[4 - col] ?? false);
			else {
				state ^= state << 13;
				state ^= state >> 17;
				state ^= state << 5;
				cols.push(((state >>> 0) % 1_000_000) / 1_000_000 > 0.45);
			}
		}
		cells.push(cols);
	}
	const [bg, fg] = PALETTE[colorHash % PALETTE.length]!;
	return (
		<svg
			viewBox="0 0 100 100"
			className="size-7 shrink-0 rounded-full"
			role="img"
			aria-label={`${name} profile picture`}
		>
			<circle cx="50" cy="50" r="50" fill={bg} />
			{cells.flatMap((row, y) =>
				row.map((filled, x) =>
					filled ? (
						<rect
							key={`${x}-${y}`}
							x={15 + x * 14}
							y={15 + y * 14}
							width={11.9}
							height={11.9}
							rx={2.1}
							fill={fg}
						/>
					) : null
				)
			)}
		</svg>
	);
}
