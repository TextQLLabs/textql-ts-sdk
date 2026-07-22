import { CHAT_MODEL_IDS, DEFAULT_CHAT_MODEL } from '$lib/chatModels';
import { isConnectError, proxyError, textqlClients } from '$lib/server/textql';
import { toJson } from '@bufbuild/protobuf';
import { json } from '@sveltejs/kit';
import { CellSchema, type WatchChatEvent } from '@textql/sdk/generated/connect/public/chat_pb.js';
import {
	TextqlRpcParadigmParamsParadigmType,
	type TextqlRpcPublicParadigmParadigm
} from '@textql/sdk/models';
import { z } from 'zod';

import type { RequestHandler } from './$types';

const ChatRequestSchema = z.object({
	message: z.string().trim().min(1, 'Message is required.'),
	chatId: z.string().trim().default(''),
	model: z.enum(CHAT_MODEL_IDS).catch(DEFAULT_CHAT_MODEL),
	connectorIds: z.array(z.number().int().positive()).default([])
});

// Default to universal paradigm
function universalParadigm(connectorIds: number[]): TextqlRpcPublicParadigmParadigm {
	return {
		type: TextqlRpcParadigmParamsParadigmType.TypeUniversal,
		version: 1,
		options: {
			universal: connectorIds.length > 0 ? { connectorIds, sqlEnabled: true } : {}
		}
	};
}

export const POST: RequestHandler = async ({ request }) => {
	const { client, streaming } = textqlClients();

	const parsed = ChatRequestSchema.safeParse(await request.json().catch(() => undefined));
	if (!parsed.success) {
		return json({ error: parsed.error.issues[0]?.message ?? 'Invalid request body.' }, { status: 400 });
	}
	const { message, model, connectorIds } = parsed.data;
	let chatId = parsed.data.chatId;

	try {
		if (!chatId) {
			const created = await client.chats.createChat({
				body: {
					model,
					paradigm: universalParadigm(connectorIds)
				}
			});
			if (isConnectError(created)) {
				return json(
					{ error: created.message ?? 'The chat service rejected the request.' },
					{ status: 502 }
				);
			}
			chatId = created.chat?.id ?? '';

			if (!chatId) {
				return json({ error: 'The chat service did not return a chat ID.' }, { status: 502 });
			}
		}

		const sent = await client.chats.send({
			body: {
				chatId,
				message
			}
		});

		if (isConnectError(sent)) {
			return json(
				{ error: sent.message ?? 'The chat service did not accept the message.' },
				{ status: 502 }
			);
		}
		const cellId = sent.cellId;
		if (!cellId) {
			return json({ error: 'The chat service did not accept the message.' }, { status: 502 });
		}

		const events = streaming.chats.watchChat(
			{ chatId, latestCompleteCellId: cellId },
			{ signal: request.signal }
		)[Symbol.asyncIterator]();

		let first: IteratorResult<WatchChatEvent>;
		try {
			first = await events.next();
		} catch (error) {
			return json(
				{ error: error instanceof Error ? error.message : 'The chat stream failed.' },
				{ status: 502 }
			);
		}

		const encoder = new TextEncoder();
		const line = (value: unknown) => encoder.encode(`${JSON.stringify(value)}\n`);

		const stream = new ReadableStream<Uint8Array>({
			async start(controller) {
				controller.enqueue(line({ type: 'meta', chatId, userCellId: cellId }));
				try {
					for (let next = first; !next.done; next = await events.next()) {
						const payload = next.value.payload;
						if (payload.case === 'cell') {
							controller.enqueue(line(toJson(CellSchema, payload.value)));
						} else if (payload.case === 'runComplete') {
							controller.enqueue(line({ type: 'done' }));
							break;
						} else if (payload.case === 'runError') {
							controller.enqueue(
								line({ error: { message: payload.value.error || 'The chat run failed.' } })
							);
							break;
						}
					}
				} catch (error) {
					if (!request.signal.aborted) {
						const message = error instanceof Error ? error.message : 'The chat stream failed.';
						controller.enqueue(line({ error: { message } }));
					}
				}
				controller.close();
				void events.return?.(undefined);
			},
			cancel() {
				void events.return?.(undefined);
			}
		});

		return new Response(stream, {
			headers: {
				'Content-Type': 'application/x-ndjson; charset=utf-8',
				'Cache-Control': 'no-cache, no-transform',
				'X-Accel-Buffering': 'no'
			}
		});
	} catch (error) {
		return proxyError('Chat service request', error);
	}
};
