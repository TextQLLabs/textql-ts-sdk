import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import { Textql } from '@textql/sdk';

import type { RequestHandler } from './$types';

type ChatRequest = {
	message?: unknown;
	chatId?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

function errorMessage(value: unknown, fallback: string) {
	if (isRecord(value) && typeof value.message === 'string') return value.message;
	return fallback;
}

export const POST: RequestHandler = async ({ request, fetch }) => {
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

	if (!message) {
		return json({ error: 'Message is required.' }, { status: 400 });
	}

	// RPC routes are mounted under /rpc/public; the SDK default server URL omits the prefix.
	const client = new Textql({ apiKey, serverURL: 'https://app.textql.com/rpc/public' });

	try {
		if (!chatId) {
			const created = await client.chats.createChat({
				body: {
					model: 'MODEL_SONNET_5',
					paradigm: {
						type: 'TYPE_UNIVERSAL',
						version: 1,
						options: { universal: {} }
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

		// @textql/sdk 1.0.6 documents streamChat but does not yet ship the generated
		// method. Keep create/send on the SDK and call that documented endpoint here.
		const upstream = await fetch(
			`https://app.textql.com/v2/chats/${encodeURIComponent(chatId)}/cells/stream`,
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Accept: 'application/x-ndjson',
					// The /v2 stream endpoint only accepts bearer auth, not tql_api_key.
					Authorization: `Bearer ${apiKey}`
				},
				body: JSON.stringify({ latestCompleteCellId: cellId }),
				signal: request.signal
			}
		);

		if (!upstream.ok || !upstream.body) {
			const detail = await upstream.text();
			return json(
				{ error: detail || `The chat stream failed with status ${upstream.status}.` },
				{ status: upstream.status || 502 }
			);
		}

		const reader = upstream.body.getReader();
		const encoder = new TextEncoder();
		const metadata = encoder.encode(`${JSON.stringify({ type: 'meta', chatId })}\n`);

		const stream = new ReadableStream<Uint8Array>({
			async start(controller) {
				controller.enqueue(metadata);
				try {
					while (true) {
						const { done, value } = await reader.read();
						if (done) break;
						controller.enqueue(value);
					}
					controller.close();
				} catch (error) {
					controller.error(error);
				}
			},
			cancel() {
				return reader.cancel();
			}
		});

		return new Response(stream, {
			headers: {
				'Content-Type': 'application/x-ndjson; charset=utf-8',
				'Cache-Control': 'no-cache, no-transform'
			}
		});
	} catch (error) {
		console.error('Chat service request failed', error);
		return json({ error: 'The chat service request failed.' }, { status: 502 });
	}
};
