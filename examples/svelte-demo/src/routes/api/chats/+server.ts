import { proxyError, textqlClients } from '$lib/server/textql';
import { json } from '@sveltejs/kit';
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

const SOURCE_LABELS: Record<string, string> = {
	CHAT_SOURCE_THREAD: 'Thread',
	CHAT_SOURCE_PLAYBOOK: 'Playbook',
	CHAT_SOURCE_SLACK: 'Slack',
	CHAT_SOURCE_FEED: 'Feed',
	CHAT_SOURCE_TEAMS: 'Teams',
	CHAT_SOURCE_SMS: 'SMS',
	CHAT_SOURCE_MCP: 'MCP',
	CHAT_SOURCE_SYSTEM: 'System'
};

function sourceLabel(source: TextqlRpcPublicChatChat['source']): string | null {
	if (typeof source !== 'string') return null;
	return SOURCE_LABELS[source] ?? null;
}

function createdBy(chat: TextqlRpcPublicChatChat): string | null {
	return chat.agentName?.trim() || chat.creatorEmail?.trim() || null;
}

export const GET: RequestHandler = async () => {
	const { client } = textqlClients();

	const getPage = async (page: number) => {
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
		return {
			chats: 'chats' in result && Array.isArray(result.chats) ? result.chats : [],
			totalCount: typeof result.totalCount === 'number' ? result.totalCount : undefined
		};
	};

	try {
		const first = await getPage(0);
		const chats: TextqlRpcPublicChatChat[] = [...first.chats];
		let totalCount = first.totalCount;

		if (totalCount !== undefined && totalCount > chats.length && first.chats.length === PAGE_SIZE) {
			// Remaining pages are independent — fetch them concurrently.
			const pageCount = Math.min(MAX_PAGES, Math.ceil(totalCount / PAGE_SIZE));
			const rest = await Promise.all(
				Array.from({ length: pageCount - 1 }, (_, i) => getPage(i + 1))
			);
			for (const page of rest) chats.push(...page.chats);
		} else if (totalCount === undefined && first.chats.length === PAGE_SIZE) {
			// No total reported: fall back to sequential paging until a short page.
			for (let page = 1; page < MAX_PAGES; page += 1) {
				const next = await getPage(page);
				chats.push(...next.chats);
				totalCount = next.totalCount ?? totalCount;
				if (next.chats.length < PAGE_SIZE) break;
			}
		}

		return json({
			chats: chats
				.filter((chat): chat is TextqlRpcPublicChatChat & { id: string } => typeof chat.id === 'string')
				.map((chat) => ({
					id: chat.id,
					title: titleFor(chat),
					createdBy: createdBy(chat),
					source: sourceLabel(chat.source),
					lastMessageAt: (chat.updatedAt ?? chat.timestamp)?.toISOString() ?? null,
					updatedAt: (chat.updatedAt ?? chat.timestamp)?.toISOString() ?? null
				})),
			totalCount: totalCount ?? chats.length
		});
	} catch (error) {
		return proxyError('Chat list request', error);
	}
};
