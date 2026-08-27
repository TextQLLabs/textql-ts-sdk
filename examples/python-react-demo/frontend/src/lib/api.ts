/**
 * The FastAPI backend (`backend/app/textql_router.py`). Vite proxies `/v3` to
 * it in dev, so the API key never reaches the browser.
 */

import type { CellLike } from './cells';

const BASE = '/v3/textql';

export type ChatSummary = {
	id: string;
	summary: string | null;
	updated_at: string | null;
	is_running: boolean;
};

/**
 * One `WatchChatEvent` as protobuf JSON. `type` names the oneof case and is
 * also the key the payload sits under, so `event[event.type]` is the payload —
 * plus the two the backend synthesises when a stream stalls or ends.
 */
export type StreamEvent = Record<string, unknown> & {
	type:
		| 'opened'
		| 'cell'
		| 'runStarted'
		| 'runComplete'
		| 'runError'
		| 'handoffPending'
		| 'heartbeat'
		| 'timeout'
		| 'streamEnded'
		| 'unknown';
	cursor?: string;
};

async function readJson(response: Response, fallback: string): Promise<unknown> {
	const payload: unknown = await response.json().catch(() => undefined);
	if (response.ok) return payload;
	const detail =
		payload && typeof payload === 'object' && 'detail' in payload
			? String((payload as { detail: unknown }).detail)
			: '';
	throw new Error(detail || fallback);
}

export async function listChats(limit = 30): Promise<ChatSummary[]> {
	const response = await fetch(`${BASE}/chats?limit=${limit}`);
	const payload = (await readJson(response, 'Unable to load chats.')) as {
		chats?: ChatSummary[];
	};
	return payload.chats ?? [];
}

/** Replayed cells, in the same protobuf JSON the stream sends. */
export async function getHistory(chatId: string): Promise<CellLike[]> {
	const response = await fetch(
		`${BASE}/chats/${encodeURIComponent(chatId)}/history?all_pages=true`
	);
	const payload = (await readJson(response, 'Unable to load this chat.')) as {
		cells?: CellLike[];
	};
	return payload.cells ?? [];
}

export async function createChat(options: {
	model: string;
	connectorIds: number[];
}): Promise<string> {
	const response = await fetch(`${BASE}/chats`, {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({
			model: options.model,
			connector_ids: options.connectorIds,
			sql_enabled: true,
			python_enabled: true
		})
	});
	const payload = (await readJson(response, 'Unable to create a chat.')) as { chat_id: string };
	return payload.chat_id;
}

/** Approve or reject a halted cell, releasing the run it parked. */
export async function resolveCell(
	cellId: string,
	kind: 'ontology' | 'context_prompt',
	action: 'approve' | 'reject'
): Promise<void> {
	const response = await fetch(`${BASE}/cells/${encodeURIComponent(cellId)}/resolve`, {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({ kind, action })
	});
	await readJson(response, `Unable to ${action} this change.`);
}

/** The TextQL host the backend talks to, plus the member the API key is. */
export type AppConfig = { appUrl: string; email: string | null };

export async function getConfig(): Promise<AppConfig> {
	const response = await fetch(`${BASE}/config`);
	const payload = (await readJson(response, 'Unable to read config.')) as {
		app_url: string;
		email?: string | null;
	};
	const email =
		typeof payload.email === 'string' && payload.email.trim() ? payload.email.trim() : null;
	return { appUrl: payload.app_url, email };
}

export async function getAppUrl(): Promise<string> {
	return (await getConfig()).appUrl;
}

export async function closeChat(chatId: string): Promise<void> {
	await fetch(`${BASE}/chats/${encodeURIComponent(chatId)}`, { method: 'DELETE' });
}

/**
 * Send a turn and read the run back as SSE.
 *
 * `latestCellId` is the previous turn's `finalCellId`: the server replays a
 * chat from the beginning otherwise, so without it every turn re-sends the
 * whole conversation. The send itself returns before the run produces
 * anything, which is why the reply arrives on this stream rather than in a
 * response body.
 */
export async function sendMessage(
	chatId: string,
	options: {
		message: string;
		latestCellId?: string;
		steering?: boolean;
		signal?: AbortSignal;
		onEvent: (event: StreamEvent) => void;
	}
): Promise<void> {
	const response = await fetch(`${BASE}/chats/${encodeURIComponent(chatId)}/send`, {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		signal: options.signal,
		body: JSON.stringify({
			message: options.message,
			steering: options.steering ?? false,
			stream: true,
			latest_cell_id: options.latestCellId ?? ''
		})
	});

	if (!response.ok || !response.body) {
		await readJson(response, 'Unable to send this message.');
		throw new Error('The server returned no stream.');
	}

	await pumpSse(response.body, options.onEvent, options.signal);
}

/** Re-attach to a parked run after OAuth / questions — unlike /send, this does not stop on runComplete. */
export async function watchChat(
	chatId: string,
	options: {
		latestCellId?: string;
		signal?: AbortSignal;
		onEvent: (event: StreamEvent) => void;
	}
): Promise<void> {
	const params = new URLSearchParams();
	if (options.latestCellId) params.set('latest_cell_id', options.latestCellId);
	const query = params.toString();
	const response = await fetch(
		`${BASE}/chats/${encodeURIComponent(chatId)}/watch${query ? `?${query}` : ''}`,
		{ signal: options.signal }
	);
	if (!response.ok || !response.body) {
		await readJson(response, 'Unable to watch this chat.');
		throw new Error('The server returned no stream.');
	}
	await pumpSse(response.body, options.onEvent, options.signal);
}

/** Read an SSE body: frames are blank-line separated, payloads on `data:`. */
async function pumpSse(
	body: ReadableStream<Uint8Array>,
	onEvent: (event: StreamEvent) => void,
	signal?: AbortSignal
): Promise<void> {
	const reader = body.getReader();
	const decoder = new TextDecoder();
	let buffer = '';

	while (true) {
		const { done, value } = await reader.read();
		if (signal?.aborted) return;
		if (value) buffer += decoder.decode(value, { stream: true });
		if (done) buffer += decoder.decode();

		const frames = buffer.split('\n\n');
		buffer = frames.pop() ?? '';
		for (const frame of frames) {
			for (const line of frame.split('\n')) {
				if (!line.startsWith('data: ')) continue;
				try {
					onEvent(JSON.parse(line.slice(6)) as StreamEvent);
				} catch {
					// A frame we can't parse is not worth tearing the run down for.
				}
			}
		}

		if (done) return;
	}
}
