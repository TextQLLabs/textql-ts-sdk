import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import { Textql } from '@textql/sdk';

import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
	const apiKey = env.TEXTQL_API_KEY;
	if (!apiKey) {
		return json({ error: 'TEXTQL_API_KEY is not configured.' }, { status: 503 });
	}

	const client = new Textql({ apiKey, serverURL: 'https://app.textql.com/rpc/public' });

	try {
		const result = await client.chats.getHistory({ body: { chatId: params.id } });

		if ('code' in result) {
			return json({ error: result.message ?? 'Chat not found.' }, { status: 404 });
		}

		const cells = 'cells' in result && Array.isArray(result.cells) ? result.cells : [];
		const messages = [];
		for (const cell of cells) {
			const content =
				'mdCell' in cell ? cell.mdCell.content : 'ansCell' in cell ? cell.ansCell.content : undefined;
			if (!content) continue;
			messages.push({ role: cell.generated ? 'assistant' : 'you', body: content });
		}

		return json({ id: params.id, messages });
	} catch (error) {
		console.error('Chat history request failed', error);
		return json({ error: 'The chat history request failed.' }, { status: 502 });
	}
};
