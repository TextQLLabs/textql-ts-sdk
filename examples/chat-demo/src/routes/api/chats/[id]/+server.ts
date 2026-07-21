import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import { extractEnabledTools } from '$lib/chatTools';
import { Textql } from '@textql/sdk';

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
	const apiKey = env.TEXTQL_API_KEY;
	if (!apiKey) {
		return json({ error: 'TEXTQL_API_KEY is not configured.' }, { status: 503 });
	}

	const client = new Textql({ apiKey, serverURL: 'https://app.textql.com/rpc/public' });

	try {
		const result = await client.chats.get({ body: { chatId: params.id } });

		if ('code' in result) {
			return json({ error: result.message ?? 'Chat not found.' }, { status: 404 });
		}

		const chat = isRecord(result.chat) ? result.chat : null;
		const rawMessages = Array.isArray(result.messages) ? result.messages : [];

		const messages = [];
		for (const message of rawMessages) {
			if (!isRecord(message) || typeof message.content !== 'string' || !message.content) continue;
			const role = message.role === 'assistant' ? 'assistant' : message.role === 'user' ? 'you' : null;
			if (!role) continue;
			messages.push({ role, body: message.content });
		}

		// Fall back to cell history when GetChat returns no flattened messages.
		if (messages.length === 0) {
			const history = await client.chats.getHistory({ body: { chatId: params.id } });
			if (!('code' in history) && Array.isArray(history.cells)) {
				for (const cell of history.cells) {
					const content =
						'mdCell' in cell
							? cell.mdCell.content
							: 'ansCell' in cell
								? cell.ansCell.content
								: undefined;
					if (!content) continue;
					messages.push({ role: cell.generated ? 'assistant' : 'you', body: content });
				}
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
