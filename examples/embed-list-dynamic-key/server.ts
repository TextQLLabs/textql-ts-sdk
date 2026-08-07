/** `embed-list`, configured entirely from `secrets.txt` rather than the environment.
 * The key and the allowlist are functions, so both are re-read as the file changes. */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';

import { parse } from 'dotenv';

import { Textql } from '@textql/sdk';
import { createEmbedHandler, EmbedError, toNodeHandler } from '@textql/sdk/embed';

import { renderPage } from './page.js';

const API_BASE = '/api/textql';

// Relative to the cwd, which npm sets to this directory for `npm start`/`dev`.
const SETTINGS_FILE = 'secrets.txt';

/** dotenv's `parse`, not its `config`: quotes, comments and `export` are handled,
 * and nothing is written to `process.env`. Re-read every call, so edits take effect. */
async function settings(): Promise<Record<string, string>> {
	return parse(await readFile(SETTINGS_FILE, 'utf8'));
}

/** For values a request cannot proceed without: the 503 says which name is missing. */
async function required(name: string): Promise<string> {
	let found: Record<string, string>;
	try {
		found = await settings();
	} catch (cause) {
		throw new EmbedError(503, `No ${name}: ${(cause as Error).message}`);
	}

	const value = found[name]?.trim();
	if (!value) throw new EmbedError(503, `No ${name}: ${SETTINGS_FILE} does not set it.`);
	return value;
}

/** For the two read at startup. Never throws: a missing file must not stop the boot. */
async function optional(name: string): Promise<string | undefined> {
	const found = await settings().catch(() => ({}) as Record<string, string>);
	return found[name]?.trim() || undefined;
}

const PORT = Number(await optional('PORT')) || 4182;

// The allowlist, and a function, so an id added to the file needs no restart. Ids
// reach the browser, but only these are ever served.
const appIds = async () =>
	(await required('TEXTQL_APP_IDS')).split(',').map((id) => id.trim()).filter(Boolean);

const handler = createEmbedHandler({
	client: new Textql({
		apiKey: () => required('TEXTQL_API_KEY'),
		// Boot-time: the SDK takes a base URL, not a resolver.
		serverURL: await optional('TEXTQL_SERVER_URL')
	}),
	appIds,
	basePath: `${API_BASE}/:appId`
});

const embed = toNodeHandler(handler);

/** The list route drops unreadable ids silently; at a terminal, say why. */
async function reportUnresolved(): Promise<void> {
	const origin = `http://localhost:${PORT}`;
	const listed = await handler(new Request(`${origin}${API_BASE}`));
	if (!listed?.ok) return;

	const found = new Set(((await listed.json()) as { id: string }[]).map((app) => app.id));
	for (const id of (await appIds()).filter((id) => !found.has(id))) {
		const response = await handler(new Request(`${origin}${API_BASE}/${id}/app`));
		const { error } = ((await response?.json()) ?? {}) as { error?: string };
		console.warn(`  ${id} is not listed: ${error ?? 'reason unknown'}`);
	}
}

const ELEMENT_JS = createRequire(import.meta.url).resolve('@textql/sdk/embed/element');

const PAGE = renderPage(API_BASE);

const server = createServer((req, res) => {
	void (async () => {
		if (await embed(req, res)) return;

		const path = new URL(req.url ?? '/', `http://${req.headers.host}`).pathname;

		if (path === '/element.js') {
			res.writeHead(200, { 'content-type': 'text/javascript; charset=utf-8' });
			return res.end(await readFile(ELEMENT_JS));
		}

		// Reads the key on purpose: a process that cannot is up but serving nothing.
		if (path === '/healthz') {
			const failure = await required('TEXTQL_API_KEY').then(
			() => null,
			(cause: Error) => cause.message
		);
			res.writeHead(failure ? 503 : 200, { 'content-type': 'application/json' });
			return res.end(JSON.stringify(failure ? { error: failure } : { ok: true }));
		}

		if (path === '/') {
			res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
			return res.end(PAGE);
		}

		res.writeHead(404, { 'content-type': 'application/json' });
		res.end(JSON.stringify({ error: 'Not found.' }));
	})();
});

server.listen(PORT, async () => {
	console.log(`Embed list demo on http://localhost:${PORT}`);
	console.log(`  everything from ./${SETTINGS_FILE}, re-read on every request`);

	for (const name of ['TEXTQL_API_KEY', 'TEXTQL_APP_IDS'] as const) {
		await required(name).then(
			(value) => console.log(`  ${name} → ${name.endsWith('KEY') ? 'set' : value}`),
			(cause: Error) => console.warn(`  ${cause.message} — requests will fail`)
		);
	}

	void reportUnresolved();
});
