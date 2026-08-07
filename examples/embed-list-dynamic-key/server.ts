/** `embed-list`, with the key read from `secrets.txt` per request rather than from the
 * environment at boot. Same handler; its client's `apiKey` is a function. */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { join } from 'node:path';

import { parse } from 'dotenv';

import { Textql } from '@textql/sdk';
import { createEmbedHandler, EmbedError, toNodeHandler } from '@textql/sdk/embed';

import { renderPage } from './page.js';

// No dotenv `config()` call, unlike the other examples: nothing is loaded into env.
const PORT = Number(process.env.PORT ?? 4182);
const API_BASE = '/api/textql';

// The allowlist. Ids reach the browser, but only these are ever served.
const APP_IDS = (process.env.TEXTQL_APP_IDS ?? process.env.TEXTQL_APP_ID ?? '')
	.split(',')
	.map((id) => id.trim())
	.filter(Boolean);

const KEY_FILE = process.env.TEXTQL_API_KEY_FILE ?? join(import.meta.dirname, 'secrets.txt');

async function secret(name: string): Promise<string> {
	let contents: string;
	try {
		contents = await readFile(KEY_FILE, 'utf8');
	} catch (cause) {
		throw new EmbedError(503, `No ${name}: ${(cause as Error).message}`);
	}

	const value = parse(contents)[name]?.trim();
	if (!value) throw new EmbedError(503, `No ${name}: ${KEY_FILE} does not set it.`);
	return value;
}

const apiKey = () => secret('TEXTQL_API_KEY');

const handler = createEmbedHandler({
	client: new Textql({ apiKey }),
	appIds: APP_IDS,
	basePath: `${API_BASE}/:appId`
});

const embed = toNodeHandler(handler);

/** The list route drops unreadable ids silently; at a terminal, say why. */
async function reportUnresolved(): Promise<void> {
	const origin = `http://localhost:${PORT}`;
	const listed = await handler(new Request(`${origin}${API_BASE}`));
	if (!listed?.ok) return;

	const found = new Set(((await listed.json()) as { id: string }[]).map((app) => app.id));
	for (const id of APP_IDS.filter((id) => !found.has(id))) {
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
			const failure = await apiKey().then(() => null, (cause: Error) => cause.message);
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

server.listen(PORT, () => {
	console.log(`Embed list (key from a file) demo on http://localhost:${PORT}`);
	console.log(`  ${API_BASE} → ${APP_IDS.length} app(s)`);
	console.log(`  key from ${KEY_FILE}, re-read on every request`);
	void apiKey().then(
		() => console.log('  key resolved'),
		(cause: Error) => console.warn(`  no key yet: ${cause.message} — requests will fail`)
	);
	if (!APP_IDS.length) console.warn('TEXTQL_APP_IDS is not set — there is nothing to list.');
	void reportUnresolved();
});
