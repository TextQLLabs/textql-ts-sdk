import { startSession } from '$lib/server/session';
import { fail, redirect } from '@sveltejs/kit';
import { Textql } from '@textql/sdk';

import type { Actions, PageServerLoad } from './$types';

/** Only ever bounce to a path inside this app, never an attacker-supplied origin. */
function safeNext(raw: string | null | undefined): string {
	if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return '/';
	return raw;
}

export const load: PageServerLoad = ({ url, locals }) => {
	const next = safeNext(url.searchParams.get('next'));
	if (locals.signedIn) redirect(303, next);
	return { next };
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const form = await request.formData();
		const apiKey = String(form.get('apiKey') ?? '').trim();
		const serverURLInput = String(form.get('serverURL') ?? '').trim();
		const next = safeNext(String(form.get('next') ?? ''));

		if (!apiKey) {
			return fail(400, { error: 'Enter an API key.', serverURL: serverURLInput });
		}

		let serverURL: string | undefined;
		if (serverURLInput) {
			let parsed: URL;
			try {
				parsed = new URL(serverURLInput);
			} catch {
				return fail(400, {
					error: 'Server URL must be a full URL, e.g. https://textql.your-company.com',
					serverURL: serverURLInput
				});
			}
			if (parsed.protocol !== 'https:') {
				return fail(400, { error: 'Server URL must use https.', serverURL: serverURLInput });
			}
			serverURL = parsed.origin;
		}

		// Prove the key works before sealing it. A bad paste should fail here with
		// something readable, not turn every page behind the door into a 502.
		try {
			const probe = new Textql({ apiKey, serverURL });
			const result = await probe.connectors.getConnectors({ body: {} });
			if (result && typeof result === 'object' && 'code' in result) {
				return fail(401, {
					error: 'TextQL rejected that key. Check it was copied in full.',
					serverURL: serverURLInput
				});
			}
		} catch (cause) {
			console.error('API key validation failed', cause);
			return fail(401, {
				error: serverURL
					? 'Could not reach that TextQL host with this key.'
					: 'Could not authenticate with that key.',
				serverURL: serverURLInput
			});
		}

		await startSession(cookies, { apiKey, ...(serverURL ? { serverURL } : {}) });
		redirect(303, next);
	}
};
