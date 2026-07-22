import { textqlClients } from '$lib/server/textql';
import type { StreamEventOut } from '$lib/streamEvents';
import { toJson } from '@bufbuild/protobuf';
import { json } from '@sveltejs/kit';
import { CellSchema, type WatchChatEvent } from '@textql/sdk/generated/connect/public/chat_pb.js';

import type { RequestHandler } from './$types';

/** After `opened`, close with `{type:'idle'}` if no run activity arrives. */
const IDLE_MS = 1500;

type Next = IteratorResult<WatchChatEvent>;

function nextOrTimeout(
	events: AsyncIterator<WatchChatEvent>,
	ms: number
): Promise<{ next: Next } | { timedOut: true }> {
	return Promise.race([
		events.next().then((next) => ({ next })),
		new Promise<{ timedOut: true }>((resolve) =>
			setTimeout(() => resolve({ timedOut: true }), ms)
		)
	]);
}

/** NDJSON re-attach after reload; same event shape as POST /api/chat. */
export const GET: RequestHandler = async ({ params, url, request }) => {
	const { streaming } = textqlClients();

	const latestCompleteCellId = url.searchParams.get('latestCompleteCellId') ?? undefined;
	const events = streaming.chats.watchChat(
		{
			chatId: params.id,
			...(latestCompleteCellId ? { latestCompleteCellId } : {})
		},
		{ signal: request.signal }
	)[Symbol.asyncIterator]();

	// Drain `opened` first so bad id / auth fails as HTTP 502, not mid-stream.
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
					if (payload.case === 'runStarted') {
						sawActivity = true;
						controller.enqueue(line({ type: 'runStarted' }));
					} else if (payload.case === 'cell') {
						// EnsureRun can resume with cells and no `runStarted`.
						if (!sawActivity) {
							sawActivity = true;
							controller.enqueue(line({ type: 'runStarted' }));
						}
						controller.enqueue(line(toJson(CellSchema, payload.value) as Record<string, unknown>));
					} else if (payload.case === 'runComplete') {
						controller.enqueue(line({ type: 'done' }));
						break;
					} else if (payload.case === 'runError') {
						controller.enqueue(
							line({ error: { message: payload.value.error || 'The chat run failed.' } })
						);
						break;
					}
				}
			} catch (error) {
				if (!request.signal.aborted) {
					const message = error instanceof Error ? error.message : 'The chat watch failed.';
					controller.enqueue(line({ error: { message } }));
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
