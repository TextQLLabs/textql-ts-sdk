import { z } from 'zod';

import type { CellLike } from '$lib/cells';

const ControlEventSchema = z.discriminatedUnion('type', [
	z.object({ type: z.literal('meta'), chatId: z.string(), userCellId: z.string().optional() }),
	z.object({ type: z.literal('runStarted') }),
	z.object({ type: z.literal('idle') }),
	z.object({ type: z.literal('done') })
]);

const ErrorEventSchema = z.object({
	error: z.object({ message: z.string().catch('The chat stream failed.') })
});

/** Cell snapshots pass through untouched; only the upsert key is enforced. */
const CellSnapshotSchema = z.looseObject({ id: z.string().min(1) });

export type ControlEvent = z.infer<typeof ControlEventSchema>;
export type ErrorEvent = z.infer<typeof ErrorEventSchema>;

/** What API routes are allowed to write as NDJSON lines. */
export type StreamEventOut = ControlEvent | ErrorEvent | Record<string, unknown>;

export type StreamEvent =
	| ControlEvent
	| { type: 'error'; message: string }
	| { type: 'cell'; cell: CellLike };

/** Parse one NDJSON line; null for blanks, keepalives, and unknown shapes. */
export function parseStreamLine(line: string): StreamEvent | null {
	const trimmed = line.trim();
	if (!trimmed) return null;

	let raw: unknown;
	try {
		raw = JSON.parse(trimmed);
	} catch {
		return null;
	}

	const control = ControlEventSchema.safeParse(raw);
	if (control.success) return control.data;

	const failure = ErrorEventSchema.safeParse(raw);
	if (failure.success) return { type: 'error', message: failure.data.error.message };

	const cell = CellSnapshotSchema.safeParse(raw);
	if (cell.success) return { type: 'cell', cell: cell.data as CellLike };

	return null;
}
