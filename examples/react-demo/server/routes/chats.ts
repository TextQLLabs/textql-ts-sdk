import { runErrorJson, watchEventJson, type StreamEventOut } from '../../src/lib/streamEvents';
import { isRecord } from '../../src/lib/utils';
import { json } from '../kit';
import type { RequestHandler, RouteHandlers } from '../kit';
import { isConnectError, proxyError, textqlClients } from '../textql';
import type { WatchChatEvent } from '@textql/sdk/generated/connect/public/chat_pb.js';
import {
	TextqlRpcPublicChatChatSortDirection,
	TextqlRpcPublicChatChatSortField,
	type TextqlRpcPublicChatChat
} from '@textql/sdk/models';

// ─── /api/chats ─────────────────────────────────────────────────────────────

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

const listChats: RequestHandler = async () => {
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
				.filter(
					(chat): chat is TextqlRpcPublicChatChat & { id: string } => typeof chat.id === 'string'
				)
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

export const chatsRoute: RouteHandlers = { GET: listChats };

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
