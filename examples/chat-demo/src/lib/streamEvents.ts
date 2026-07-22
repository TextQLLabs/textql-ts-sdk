import { create, fromJson, toJson, type JsonObject, type JsonValue } from '@bufbuild/protobuf';
import {
	type Cell,
	CellSchema,
	type WatchChatEvent,
	WatchChatEventSchema
} from '@textql/sdk/generated/connect/public/chat_pb.js';
import { z } from 'zod';

import type { CellLike } from '$lib/cells';

const ControlEventSchema = z.discriminatedUnion('type', [
	z.object({ type: z.literal('meta'), chatId: z.string(), userCellId: z.string().optional() }),
	z.object({ type: z.literal('idle') })
]);

export type ControlEvent = z.infer<typeof ControlEventSchema>;

export type StreamEventOut = ControlEvent | JsonObject;

export function watchEventJson(event: WatchChatEvent): JsonObject {
	return toJson(WatchChatEventSchema, event) as JsonObject;
}

export function runErrorJson(message: string): JsonObject {
	return watchEventJson(
		create(WatchChatEventSchema, {
			payload: { case: 'runError', value: { error: message, code: '' } }
		})
	);
}

export function toCellLike(cell: Cell): CellLike {
	return toJson(CellSchema, cell) as CellLike;
}

export type StreamEvent = ControlEvent | { type: 'event'; event: WatchChatEvent };

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

	try {
		// Tolerate fields newer than the vendored schema — never drop a live
		// cell because the server's proto is ahead.
		return {
			type: 'event',
			event: fromJson(WatchChatEventSchema, raw as JsonValue, { ignoreUnknownFields: true })
		};
	} catch {
		return null;
	}
}
