import { isConnectError, proxyError, textqlClients } from '$lib/server/textql';
import { isRecord } from '$lib/utils';
import { json } from '@sveltejs/kit';

import type { RequestHandler } from './$types';

function extractUniversal(chat: Record<string, unknown>): Record<string, unknown> | null {
	const paradigm = isRecord(chat.paradigm) ? chat.paradigm : null;
	const options = paradigm && isRecord(paradigm.options) ? paradigm.options : null;
	const universal = options && isRecord(options.universal) ? options.universal : null;
	return universal;
}

function extractConnectorIds(universal: Record<string, unknown> | null): number[] {
	const ids = universal?.connectorIds;
	if (!Array.isArray(ids)) return [];
	return ids.filter((id): id is number => typeof id === 'number' && Number.isInteger(id));
}

/** Text content of a user-authored cell (`mdCell` / `ansCell`), else ''. */
function userTextContent(cell: Record<string, unknown>): string {
	for (const key of ['mdCell', 'ansCell']) {
		const payload = cell[key];
		if (isRecord(payload) && typeof payload.content === 'string') return payload.content;
	}
	return '';
}

export const GET: RequestHandler = async ({ params }) => {
	const { client } = textqlClients();

	try {
		// Independent lookups — run them concurrently.
		const [result, historyCells] = await Promise.all([
			client.chats.get({ body: { chatId: params.id } }),
			(async (): Promise<unknown[] | null> => {
				const cells: unknown[] = [];
				const limit = 100;
				let skip = 0;
				while (true) {
					const page = await client.chats.getHistory({
						body: { chatId: params.id, limit, skip }
					});
					if (isConnectError(page)) return null;
					const pageCells = Array.isArray(page.cells) ? page.cells : [];
					cells.push(...pageCells);
					if (!page.hasMore || pageCells.length === 0) return cells;
					skip += pageCells.length;
				}
			})()
		]);

		if (isConnectError(result)) {
			return json({ error: result.message ?? 'Chat not found.' }, { status: 404 });
		}

		const chat = isRecord(result.chat) ? result.chat : null;

		// Prefer raw cell history: assistant turns keep every cell (SQL, Python,
		// web search, thinking, ...) so the client can render the full tool
		// sequence, not just flattened text.
		type Turn = { role: 'you' | 'assistant'; body?: string; cells?: unknown[] };
		const messages: Turn[] = [];

		if (historyCells) {
			let assistantTurn: Turn | null = null;
			// GetChatHistory is newest-first, including cells within each turn.
			for (const cell of [...historyCells].reverse()) {
				if (!isRecord(cell)) continue;
				if (cell.generated !== true) {
					const content = userTextContent(cell);
					if (content) {
						messages.push({ role: 'you', body: content });
						assistantTurn = null;
					}
					continue;
				}
				if (!assistantTurn) {
					assistantTurn = { role: 'assistant', cells: [] };
					messages.push(assistantTurn);
				}
				assistantTurn.cells?.push(cell);
			}
		}

		// Fall back to GetChat's flattened messages when history has no cells.
		if (messages.length === 0) {
			const rawMessages = Array.isArray(result.messages) ? result.messages : [];
			for (const message of rawMessages) {
				if (!isRecord(message) || typeof message.content !== 'string' || !message.content)
					continue;
				const role =
					message.role === 'assistant' ? 'assistant' : message.role === 'user' ? 'you' : null;
				if (!role) continue;
				messages.push({ role, body: message.content });
			}
		}

		return json({
			id: params.id,
			messages,
			model: chat && typeof chat.model === 'string' ? chat.model : null,
			connectorIds: extractConnectorIds(chat ? extractUniversal(chat) : null)
		});
	} catch (error) {
		return proxyError('Chat request', error);
	}
};

export const DELETE: RequestHandler = async ({ params }) => {
	const { client } = textqlClients();

	try {
		const result = await client.chats.delete({ body: { chatId: params.id } });

		if (isRecord(result) && isConnectError(result)) {
			return json(
				{ error: typeof result.message === 'string' ? result.message : 'Unable to delete chat.' },
				{ status: 404 }
			);
		}

		return json({ ok: true, id: params.id });
	} catch (error) {
		return proxyError('Chat delete request', error);
	}
};
