import { useEffect, useRef } from 'react';

import { getIdenticonCells, getIdenticonPalette } from '../lib/agentIdenticon';

type Props = {
	name: string;
	agentId?: string;
	size?: number;
	isActive?: boolean;
	className?: string;
};

function roundRect(
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	w: number,
	h: number,
	r: number
) {
	ctx.beginPath();
	ctx.moveTo(x + r, y);
	ctx.lineTo(x + w - r, y);
	ctx.quadraticCurveTo(x + w, y, x + w, y + r);
	ctx.lineTo(x + w, y + h - r);
	ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
	ctx.lineTo(x + r, y + h);
	ctx.quadraticCurveTo(x, y + h, x, y + h - r);
	ctx.lineTo(x, y + r);
	ctx.quadraticCurveTo(x, y, x + r, y);
	ctx.closePath();
}

export function AgentIdenticon({
	name,
	agentId = undefined,
	size = 30,
	isActive = true,
	className = ''
}: Props) {
	const canvasRef = useRef<HTMLCanvasElement | null>(null);

	// Stable seed so the avatar doesn't change when an agent is renamed.
	const seed = agentId || name;

	useEffect(() => {
		const el = canvasRef.current;
		if (!el || size <= 0) return;

		const cells = getIdenticonCells(seed);
		const palette = getIdenticonPalette(seed, isActive);

		const dpr = typeof devicePixelRatio !== 'undefined' ? devicePixelRatio : 1;
		el.width = size * dpr;
		el.height = size * dpr;

		const ctx = el.getContext('2d');
		if (!ctx) return;

		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		ctx.clearRect(0, 0, size, size);

		// Full-bleed background — the container clips to its own shape.
		ctx.fillStyle = palette.bg;
		ctx.fillRect(0, 0, size, size);

		const gridSize = 5;
		const pad = size * 0.15;
		const cellSize = (size - pad * 2) / gridSize;
		const r = cellSize * 0.15;

		ctx.fillStyle = palette.fg;
		for (let row = 0; row < gridSize; row++) {
			for (let col = 0; col < gridSize; col++) {
				if (!cells[row]![col]) continue;
				const x = pad + col * cellSize;
				const y = pad + row * cellSize;
				roundRect(ctx, x, y, cellSize * 0.85, cellSize * 0.85, r);
				ctx.fill();
			}
		}
	}, [seed, size, isActive]);

	return (
		<canvas
			ref={canvasRef}
			className={className}
			style={{ width: `${size}px`, height: `${size}px` }}
			aria-label={`Agent identicon for ${name}`}
		/>
	);
}
