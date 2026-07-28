import { readSession } from '$lib/server/session';
import { json, redirect } from '@sveltejs/kit';
import { Textql } from '@textql/sdk';
import { createStreamingClient } from '@textql/sdk/streaming';

import type { Handle } from '@sveltejs/kit';

/**
 * `@connectrpc/connect-web` hardcodes `redirect: "error"` in its fetch init,
 * and workerd rejects that outright ("Invalid redirect value…"), so every
 * streaming RPC fails on Cloudflare while unary calls sail through.
 *
 * Nothing in the Connect protocol depends on it — a redirect mid-RPC is a
 * protocol error either way — so downgrade to "manual" and let the transport
 * fail on the unexpected status, which is what "error" was buying anyway.
 *
 * Fixed in the SDK itself by #17; keep this until a release carrying that
 * lands, so the demo also runs against the published @textql/sdk.
 */
const edgeFetch: typeof globalThis.fetch = (input, init) =>
	fetch(input, init?.redirect === 'error' ? { ...init, redirect: 'manual' } : init);

/** Reachable without a session: the front door itself, plus static assets. */
function isPublic(pathname: string): boolean {
	return (
		pathname === '/login' ||
		pathname === '/logout' ||
		pathname === '/robots.txt' ||
		pathname === '/favicon.ico' ||
		pathname.startsWith('/fonts/')
	);
}

export const handle: Handle = async ({ event, resolve }) => {
	const session = await readSession(event.cookies);

	if (session) {
		// A fresh client pair per request. The credential belongs to this visitor,
		// so it must not outlive — or be reachable from — the request that carried
		// it. Both clients are thin `fetch` wrappers, so this is cheap.
		const client = new Textql({ apiKey: session.apiKey, serverURL: session.serverURL });
		// Built from options rather than from `client`, because only the options
		// form lets us pass the patched fetch above.
		const streaming = createStreamingClient({
			apiKey: session.apiKey,
			...(session.serverURL ? { serverURL: session.serverURL } : {}),
			fetch: edgeFetch
		});
		event.locals.textql = { client, streaming };
	}

	event.locals.signedIn = Boolean(session);
	event.locals.serverURL = session?.serverURL ?? null;

	const { pathname } = event.url;
	if (!session && !isPublic(pathname)) {
		// `fetch` callers get a status they can branch on; navigations get the door.
		if (pathname.startsWith('/api/')) {
			return json({ error: 'Not signed in.' }, { status: 401 });
		}
		redirect(303, `/login?next=${encodeURIComponent(pathname + event.url.search)}`);
	}

	return resolve(event);
};
