import { env } from '$env/dynamic/private';
import { toJson } from '@bufbuild/protobuf';
import { json } from '@sveltejs/kit';
import { Textql } from '@textql/sdk';
import { type Cell, CellSchema } from '@textql/sdk/generated/connect/public/chat_pb.js';
import { TextqlRpcPublicChatLlmModel } from '@textql/sdk/models';
import { createStreamingClient } from '@textql/sdk/streaming';

import type { RequestHandler } from './$types';

type ChatRequest = {
	message?: unknown;
	chatId?: unknown;
	model?: unknown;
	connectorIds?: unknown;
};

const ALLOWED_MODELS = new Set<string>([
	TextqlRpcPublicChatLlmModel.ModelHaiku45,
	TextqlRpcPublicChatLlmModel.ModelSonnet5,
	TextqlRpcPublicChatLlmModel.ModelOpus48
]);

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

function errorMessage(value: unknown, fallback: string) {
	if (isRecord(value) && typeof value.message === 'string') return value.message;
	return fallback;
}

function resolveModel(value: unknown) {
	if (typeof value === 'string' && ALLOWED_MODELS.has(value)) {
		return value as typeof TextqlRpcPublicChatLlmModel.ModelSonnet5;
	}
	return TextqlRpcPublicChatLlmModel.ModelSonnet5;
}

export const POST: RequestHandler = async ({ request }) => {
	const apiKey = env.TEXTQL_API_KEY;

	if (!apiKey) {
		return json({ error: 'TEXTQL_API_KEY is not configured.' }, { status: 503 });
	}

	let payload: ChatRequest;
	try {
		payload = await request.json();
	} catch {
		return json({ error: 'Request body must be valid JSON.' }, { status: 400 });
	}

	const message = typeof payload.message === 'string' ? payload.message.trim() : '';
	let chatId = typeof payload.chatId === 'string' ? payload.chatId.trim() : '';
	const model = resolveModel(payload.model);
	const connectorIds = Array.isArray(payload.connectorIds)
		? payload.connectorIds.filter(
			(id): id is number => typeof id === 'number' && Number.isInteger(id) && id > 0
		)
		: [];

	if (!message) {
		return json({ error: 'Message is required.' }, { status: 400 });
	}

	// RPC routes are mounted under /rpc/public; the SDK default server URL omits the prefix.
	const client = new Textql({ apiKey, serverURL: 'https://app.textql.com/rpc/public' });

	try {
		if (!chatId) {
			const created = await client.chats.createChat({
				body: {
					model,
					paradigm: {
						type: 'TYPE_UNIVERSAL',
						version: 1,
						options: {
							universal: {
								...(connectorIds.length > 0
									? { connectorIds, sqlEnabled: true }
									: {})
							}
						}
					}
				}
			});
			const chat = isRecord(created) && isRecord(created.chat) ? created.chat : null;
			chatId = chat && typeof chat.id === 'string' ? chat.id : '';

			if (!chatId) {
				return json(
					{ error: errorMessage(created, 'The chat service did not return a chat ID.') },
					{ status: 502 }
				);
			}
		}

		const sent = await client.chats.send({
			body: {
				chatId,
				message
			}
		});

		const cellId = 'cellId' in sent && typeof sent.cellId === 'string' ? sent.cellId : '';
		if (!cellId) {
			return json(
				{ error: errorMessage(sent, 'The chat service did not accept the message.') },
				{ status: 502 }
			);
		}

		const streaming = createStreamingClient({ apiKey });
		const cells = streaming.chats.streamChat(
			{ chatId, latestCompleteCellId: cellId },
			{ signal: request.signal }
		)[Symbol.asyncIterator]();

		let first: IteratorResult<Cell>;
		try {
			first = await cells.next();
		} catch (error) {
			return json({ error: errorMessage(error, 'The chat stream failed.') }, { status: 502 });
		}

		const encoder = new TextEncoder();
		const line = (value: unknown) => encoder.encode(`${JSON.stringify(value)}\n`);

		const stream = new ReadableStream<Uint8Array>({
			async start(controller) {
				controller.enqueue(line({ type: 'meta', chatId, userCellId: cellId }));
				try {
					let next = first;
					while (!next.done) {
						controller.enqueue(line(toJson(CellSchema, next.value)));
						next = await cells.next();
					}
				} catch (error) {
					if (!request.signal.aborted) {
						controller.enqueue(
							line({ error: { message: errorMessage(error, 'The chat stream failed.') } })
						);
					}
				}
				controller.close();
			},
			cancel() {
				void cells.return?.(undefined);
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
		console.error('Chat service request failed', error);
		return json({ error: 'The chat service request failed.' }, { status: 502 });
	}
};
