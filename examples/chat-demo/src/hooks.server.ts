import { readSession } from '$lib/server/session';
import { json, redirect } from '@sveltejs/kit';
import { Textql } from '@textql/sdk';
import { createStreamingClient } from '@textql/sdk/streaming';

import type { Handle } from '@sveltejs/kit';

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
		event.locals.textql = { client, streaming: createStreamingClient(client) };
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
