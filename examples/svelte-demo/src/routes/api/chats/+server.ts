import {
	createdAfterFor,
	pagingFields,
	proxyError,
	readPaging,
	textqlClients,
	toIsoString
} from '$lib/server/textql';
import { json } from '@sveltejs/kit';
import {
	TextqlRpcPublicChatChatSortDirection,
	TextqlRpcPublicChatChatSortField,
	TextqlRpcPublicChatChatSource
} from '@textql/sdk/models';

import type { TextqlRpcPublicChatChat } from '@textql/sdk/models';
import type { RequestHandler } from './$types';

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

const SORT_FIELDS: Record<string, TextqlRpcPublicChatChatSortField> = {
	updated: TextqlRpcPublicChatChatSortField.ChatSortFieldUpdatedAt,
	created: TextqlRpcPublicChatChatSortField.ChatSortFieldCreatedAt,
	name: TextqlRpcPublicChatChatSortField.ChatSortFieldName
};

const KNOWN_SOURCES = new Set<string>(Object.values(TextqlRpcPublicChatChatSource));

export const GET: RequestHandler = async ({ url }) => {
	const { client } = textqlClients();

	const paging = readPaging(url);

	// Facet values from the FilterToolbar, applied server-side so they span the
	// whole list rather than the page already loaded.
	const searchTerm = url.searchParams.get('q')?.trim() || undefined;
	const creatorMemberIds = url.searchParams.getAll('creator').filter(Boolean);
	// The facet sends raw enum names; drop anything the SDK doesn't know rather
	// than passing it through to the RPC.
	const sources = url.searchParams
		.getAll('source')
		.filter((source): source is TextqlRpcPublicChatChatSource => KNOWN_SOURCES.has(source));
	const scope = url.searchParams.getAll('scope');
	const createdAfter = createdAfterFor(url.searchParams.get('date'));
	const sortBy = SORT_FIELDS[url.searchParams.get('sort') ?? ''] ?? SORT_FIELDS.updated;
	const sortDirection =
		url.searchParams.get('dir') === 'asc'
			? TextqlRpcPublicChatChatSortDirection.ChatSortDirectionAsc
			: TextqlRpcPublicChatChatSortDirection.ChatSortDirectionDesc;

	try {
		const result = await client.chats.getAll({
			body: {
				// Org-wide: surface everyone's threads, not just the caller's.
				memberOnly: false,
				limit: paging.pageSize,
				offset: paging.offset,
				sortBy,
				sortDirection,
				searchTerm,
				...(creatorMemberIds.length ? { creatorMemberIds } : {}),
				...(sources.length ? { sources } : {}),
				bookmarkedOnly: scope.includes('bookmarked') || undefined,
				sharedWithMe: scope.includes('shared') || undefined,
				createdAfter,
				excludeBatchRuns: true,
				excludeUnusedPlaybooks: true,
				excludeFeed: true
			}
		});

		// Proto3 JSON omits empty fields, so a member with no chats gets `{}` back.
		const chats = 'chats' in result && Array.isArray(result.chats) ? result.chats : [];
		const totalCount = typeof result.totalCount === 'number' ? result.totalCount : undefined;

		const items = chats
			.filter(
				(chat): chat is TextqlRpcPublicChatChat & { id: string } => typeof chat.id === 'string'
			)
			.map((chat) => ({
				id: chat.id,
				title: titleFor(chat),
				createdBy: createdBy(chat),
				source: sourceLabel(chat.source),
				// Not always a Date at runtime — older rows come back as strings.
				lastMessageAt: toIsoString(chat.updatedAt ?? chat.timestamp),
				updatedAt: toIsoString(chat.updatedAt ?? chat.timestamp)
			}));

		return json({ chats: items, ...pagingFields(paging, totalCount, chats.length) });
	} catch (error) {
		return proxyError('Chat list request', error);
	}
};
