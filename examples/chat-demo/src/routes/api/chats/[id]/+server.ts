import { textqlClients } from '$lib/server/textql';
import { json } from '@sveltejs/kit';
import { extractEnabledTools } from '$lib/chatTools';

import type { RequestHandler } from './$types';

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

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

export const GET: RequestHandler = async ({ params }) => {
	const { client } = textqlClients();

	try {
		const result = await client.chats.get({ body: { chatId: params.id } });

		if ('code' in result) {
			return json({ error: result.message ?? 'Chat not found.' }, { status: 404 });
		}

		const chat = isRecord(result.chat) ? result.chat : null;

		// Prefer raw cell history: assistant turns keep every cell (SQL, Python,
		// web search, thinking, ...) so the client can render the full tool
		// sequence, not just flattened text.
		type Turn = { role: 'you' | 'assistant'; body?: string; cells?: unknown[] };
		const messages: Turn[] = [];

		const history = await client.chats.getHistory({ body: { chatId: params.id } });
		if (!('code' in history) && Array.isArray(history.cells)) {
			let assistantTurn: Turn | null = null;
			for (const cell of history.cells) {
				if (!isRecord(cell)) continue;
				if (cell.generated !== true) {
					const content =
						'mdCell' in cell && isRecord(cell.mdCell) && typeof cell.mdCell.content === 'string'
							? cell.mdCell.content
							: 'ansCell' in cell &&
								  isRecord(cell.ansCell) &&
								  typeof cell.ansCell.content === 'string'
								? cell.ansCell.content
								: '';
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

		const universal = chat ? extractUniversal(chat) : null;

		return json({
			id: params.id,
			messages,
			model: chat && typeof chat.model === 'string' ? chat.model : null,
			connectorIds: extractConnectorIds(universal),
			tools: extractEnabledTools(universal)
		});
	} catch (error) {
		console.error('Chat get request failed', error);
		return json({ error: 'The chat request failed.' }, { status: 502 });
	}
};

export const DELETE: RequestHandler = async ({ params }) => {
	const { client } = textqlClients();

	try {
		const result = await client.chats.delete({ body: { chatId: params.id } });

		if (isRecord(result) && 'code' in result) {
			return json(
				{ error: typeof result.message === 'string' ? result.message : 'Unable to delete chat.' },
				{ status: 404 }
			);
		}

		return json({ ok: true, id: params.id });
	} catch (error) {
		console.error('Chat delete request failed', error);
		return json({ error: 'The chat delete request failed.' }, { status: 502 });
	}
};
