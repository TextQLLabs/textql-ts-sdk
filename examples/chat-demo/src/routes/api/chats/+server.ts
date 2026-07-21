import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import { Textql } from '@textql/sdk';
import {
	TextqlRpcPublicChatChatSortDirection,
	TextqlRpcPublicChatChatSortField
} from '@textql/sdk/models';

import type { TextqlRpcPublicChatChat } from '@textql/sdk/models';
import type { RequestHandler } from './$types';

const PAGE_SIZE = 100;
const MAX_PAGES = 50;

function titleFor(chat: TextqlRpcPublicChatChat) {
	return chat.summary?.trim() || chat.preview?.trim() || 'New chat';
}

export const GET: RequestHandler = async () => {
	const apiKey = env.TEXTQL_API_KEY;
	if (!apiKey) {
		return json({ error: 'TEXTQL_API_KEY is not configured.' }, { status: 503 });
	}

	const client = new Textql({ apiKey, serverURL: 'https://app.textql.com/rpc/public' });
	const chats: TextqlRpcPublicChatChat[] = [];
	let totalCount: number | undefined;

	try {
		for (let page = 0; page < MAX_PAGES; page += 1) {
			const result = await client.chats.getAll({
				body: {
					memberOnly: true,
					limit: PAGE_SIZE,
					offset: page * PAGE_SIZE,
					sortBy: TextqlRpcPublicChatChatSortField.ChatSortFieldUpdatedAt,
					sortDirection: TextqlRpcPublicChatChatSortDirection.ChatSortDirectionDesc,
					excludeBatchRuns: true,
					excludeUnusedPlaybooks: true,
					excludeFeed: true
				}
			});

			// Proto3 JSON omits empty fields, so a member with no chats gets `{}` back.
			const pageChats = 'chats' in result && Array.isArray(result.chats) ? result.chats : [];
			chats.push(...pageChats);
			totalCount = typeof result.totalCount === 'number' ? result.totalCount : totalCount;

			if (pageChats.length < PAGE_SIZE || (totalCount !== undefined && chats.length >= totalCount)) {
				break;
			}
		}

		return json({
			chats: chats
				.filter((chat): chat is TextqlRpcPublicChatChat & { id: string } => typeof chat.id === 'string')
				.map((chat) => ({
					id: chat.id,
					title: titleFor(chat),
					updatedAt: (chat.updatedAt ?? chat.timestamp)?.toISOString() ?? null
				})),
			totalCount: totalCount ?? chats.length
		});
	} catch (error) {
		console.error('Chat list request failed', error);
		return json({ error: 'The chat list request failed.' }, { status: 502 });
	}
};
