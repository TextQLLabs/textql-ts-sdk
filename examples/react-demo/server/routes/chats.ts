import { runErrorJson, watchEventJson, type StreamEventOut } from '../../src/lib/streamEvents';
import { isRecord } from '../../src/lib/utils';
import { json } from '../kit';
import type { RequestHandler, RouteHandlers } from '../kit';
import {
	createdAfterFor,
	isConnectError,
	pagingFields,
	proxyError,
	readPaging,
	textqlClients,
	toIsoString
} from '../textql';
import type { WatchChatEvent } from '@textql/sdk/generated/connect/public/chat_pb.js';
import {
	TextqlRpcPublicChatChatSortDirection,
	TextqlRpcPublicChatChatSortField,
	TextqlRpcPublicChatChatSource,
	type TextqlRpcPublicChatChat
} from '@textql/sdk/models';

// ─── /api/chats ─────────────────────────────────────────────────────────────

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

const listChats: RequestHandler = async ({ url }) => {
	const { client } = textqlClients();

	const paging = readPaging(url);

	// Facet values from the FilterToolbar, applied server-side so they span the
	// whole list rather than the page already loaded.
	const searchTerm = url.searchParams.get('q')?.trim() || undefined;
	const creatorMemberIds = url.searchParams.getAll('creator').filter(Boolean);
	// The facet sends raw enum names; drop anything the SDK doesn't know rather
	// than passing it through to the RPC.
	const knownSources = new Set<string>(Object.values(TextqlRpcPublicChatChatSource));
	const sources = url.searchParams
		.getAll('source')
		.filter((source): source is TextqlRpcPublicChatChatSource => knownSources.has(source));
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

export const chatsRoute: RouteHandlers = { GET: listChats };

// ─── /api/chats/members ─────────────────────────────────────────────────────

/**
 * Creator facet options for the threads toolbar. Every member who has authored
 * a chat, so the facet lists people the list can actually be narrowed to.
 */
const listChatMembers: RequestHandler = async () => {
	const { client } = textqlClients();

	try {
		const result = await client.chats.getMembersWithChats({ body: {} });
		const members = 'members' in result && Array.isArray(result.members) ? result.members : [];

		return json({
			members: members
				.filter((member) => typeof member.memberId === 'string')
				.map((member) => ({
					id: member.memberId,
					name: member.memberName?.trim() || null,
					email: member.memberEmail?.trim() || null,
					pictureUrl: member.memberPictureUrl?.trim() || null
				}))
		});
	} catch (error) {
		return proxyError('Chat members request', error);
	}
};

export const chatMembersRoute: RouteHandlers = { GET: listChatMembers };

// ─── /api/chats/[id] ────────────────────────────────────────────────────────

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

const getChat: RequestHandler = async ({ params }) => {
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

		type Turn = { role: 'you' | 'assistant'; body?: string; cells?: unknown[] };
		const messages: Turn[] = [];

		if (historyCells) {
			let assistantTurn: Turn | null = null;
			for (const cell of historyCells) {
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
				if (!isRecord(message) || typeof message.content !== 'string' || !message.content) continue;
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

const deleteChat: RequestHandler = async ({ params }) => {
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

export const chatDetailRoute: RouteHandlers = { GET: getChat, DELETE: deleteChat };

// ─── /api/chats/[id]/watch ──────────────────────────────────────────────────

/** After `opened`, close with `{type:'idle'}` if no run activity arrives. */
const IDLE_MS = 1500;

type Next = IteratorResult<WatchChatEvent>;

function nextOrTimeout(
	events: AsyncIterator<WatchChatEvent>,
	ms: number
): Promise<{ next: Next } | { timedOut: true }> {
	return Promise.race([
		events.next().then((next) => ({ next })),
		new Promise<{ timedOut: true }>((resolve) => setTimeout(() => resolve({ timedOut: true }), ms))
	]);
}

const watchChat: RequestHandler = async ({ params, url, request }) => {
	const { streaming } = textqlClients();

	const latestCompleteCellId = url.searchParams.get('latestCompleteCellId') ?? undefined;
	const events = streaming.chats.watchChat(
		{
			chatId: params.id,
			...(latestCompleteCellId ? { latestCompleteCellId } : {})
		},
		{ signal: request.signal }
	)[Symbol.asyncIterator]();

	try {
		await events.next();
	} catch (error) {
		return json(
			{ error: error instanceof Error ? error.message : 'The chat watch failed.' },
			{ status: 502 }
		);
	}

	const encoder = new TextEncoder();
	const line = (value: StreamEventOut) => encoder.encode(`${JSON.stringify(value)}\n`);

	const stream = new ReadableStream<Uint8Array>({
		async start(controller) {
			let sawActivity = false;
			try {
				while (true) {
					const result = sawActivity
						? { next: await events.next() }
						: await nextOrTimeout(events, IDLE_MS);
					if ('timedOut' in result) {
						controller.enqueue(line({ type: 'idle' }));
						break;
					}
					if (result.next.done) break;

					const payload = result.next.value.payload;
					if (payload.case !== 'heartbeat') sawActivity = true;
					controller.enqueue(line(watchEventJson(result.next.value)));
					if (payload.case === 'runComplete' || payload.case === 'runError') break;
				}
			} catch (error) {
				if (!request.signal.aborted) {
					const message = error instanceof Error ? error.message : 'The chat watch failed.';
					controller.enqueue(line(runErrorJson(message)));
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
};

export const chatWatchRoute: RouteHandlers = { GET: watchChat };
