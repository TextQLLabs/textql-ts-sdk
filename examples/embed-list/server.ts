/**
 * Embedding several Data Apps with `@textql/sdk/embed`: a list, then the app.
 *
 * One handler serves all of them. The `:appId` placeholder in `basePath` picks
 * which, checked against the `appIds` allowlist, and that same allowlist turns
 * on the list route the grid reads. See `examples/embed-app` for one app.
 */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

import { config } from 'dotenv';
import { createEmbedHandler, toNodeHandler } from '@textql/sdk/embed';

// The repo root .env, shared by every example. Resolved from this file, not the cwd.
const ENV_FILE = fileURLToPath(new URL('../../.env', import.meta.url));
const { error: envError } = config({ path: ENV_FILE, override: true });

const PORT = Number(process.env.PORT ?? 4181);
const API_BASE = '/api/textql';

// The allowlist. Ids reach the browser, but only these are ever served.
const APP_IDS = (process.env.TEXTQL_APP_IDS ?? process.env.TEXTQL_APP_ID ?? '')
	.split(',')
	.map((id) => id.trim())
	.filter(Boolean);

// Hides apps the key's own member authored — "shared with me", practically.
const EXCLUDE_OWN = process.env.TEXTQL_EXCLUDE_OWN === '1';

const handler = createEmbedHandler({
	appIds: APP_IDS,
	basePath: `${API_BASE}/:appId`,
	excludeOwn: EXCLUDE_OWN
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

// One page for both. `GET /api/textql` is the SDK's list route.
const PAGE = `<!doctype html>
<title>Data apps</title>
<style>
	html, body { height: 100%; margin: 0 }
	body {
		display: flex; flex-direction: column;
		font: 14px/1.5 system-ui, -apple-system, sans-serif; color: #374151;
	}
	header {
		display: flex; align-items: center; gap: 12px;
		padding: 16px 24px; border-bottom: 1px solid #e5e7eb;
	}
	h1 { margin: 0; font-size: 15px; font-weight: 600; }
	a { color: inherit; text-decoration: none; }
	a:hover { text-decoration: underline; }
	main { flex: 1; min-height: 0; }
	.grid {
		display: grid; gap: 16px; padding: 24px;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
	}
	.card {
		display: block; overflow: hidden; text-align: left; padding: 0;
		border: 1px solid #e5e7eb; border-radius: 8px; background: #fff;
		font: inherit; color: inherit; cursor: pointer;
	}
	.card:hover { border-color: #9ca3af; }
	.card img, .card .blank {
		display: block; width: 100%; aspect-ratio: 16 / 10;
		object-fit: cover; background: #f3f4f6; border-bottom: 1px solid #e5e7eb;
	}
	.card p { margin: 0; padding: 12px 14px; font-weight: 500; }
	.empty { padding: 24px; color: #6b7280; }
	textql-app { height: 100% }
</style>

<header>
	<a id="back" href="#" hidden>&larr; All apps</a>
	<h1 id="title">Data apps</h1>
</header>
<main id="main"></main>

<script type="module" src="/element.js"></script>
<script type="module">
	const API_BASE = ${JSON.stringify(API_BASE)};
	const main = document.querySelector('#main');
	const title = document.querySelector('#title');
	const back = document.querySelector('#back');

	const apiBase = (id) => \`\${API_BASE}/\${encodeURIComponent(id)}\`;

	// Resolved once and reused, so going back to the list does not re-fetch.
	let apps = null;
	async function load() {
		if (apps) return apps;
		const response = await fetch(API_BASE);
		const body = await response.json();
		if (!response.ok) throw new Error(body.error ?? \`The list returned \${response.status}.\`);
		apps = body;
		return apps;
	}

	function card(app) {
		const button = document.createElement('button');
		button.className = 'card';
		button.innerHTML = app.screenshotUrl
			? \`<img src="\${encodeURI(app.screenshotUrl)}" alt="">\`
			: '<div class="blank"></div>';
		// textContent, not innerHTML: the name is the app's, not ours.
		const name = document.createElement('p');
		name.textContent = app.name;
		button.append(name);
		button.addEventListener('click', () => (location.hash = app.id));
		return button;
	}

	function note(text) {
		const element = document.createElement('p');
		element.className = 'empty';
		element.textContent = text;
		return element;
	}

	async function list() {
		title.textContent = 'Data apps';
		back.hidden = true;
		main.replaceChildren(note('Loading\\u2026'));

		try {
			const found = await load();
			if (!found.length) return main.replaceChildren(note('No apps to show.'));
			const grid = document.createElement('div');
			grid.className = 'grid';
			grid.append(...found.map(card));
			main.replaceChildren(grid);
		} catch (cause) {
			main.replaceChildren(note(cause.message));
		}
	}

	function app(id) {
		// Fresh element, so api-base is set before insertion and the first load is right.
		const element = document.createElement('textql-app');
		element.setAttribute('api-base', apiBase(id));
		element.addEventListener('app-meta', ({ detail }) => (title.textContent = detail.name));

		title.textContent = 'Loading\\u2026';
		back.hidden = false;
		main.replaceChildren(element);
	}

	// Checked against the list, so a hand-typed id shows the grid, not a 404.
	async function route() {
		const id = location.hash.slice(1);
		if (!id) return list();
		const found = await load().catch(() => []);
		found.some((entry) => entry.id === id) ? app(id) : list();
	}

	addEventListener('hashchange', route);
	route();
</script>
`;

const server = createServer((req, res) => {
	void (async () => {
		if (await embed(req, res)) return;

		const path = new URL(req.url ?? '/', `http://${req.headers.host}`).pathname;

		if (path === '/element.js') {
			res.writeHead(200, { 'content-type': 'text/javascript; charset=utf-8' });
			return res.end(await readFile(ELEMENT_JS));
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
	console.log(`Embed list demo on http://localhost:${PORT}`);
	console.log(envError ? `No env file at ${ENV_FILE}` : `Env from ${ENV_FILE}`);
	console.log(`  ${API_BASE} → ${APP_IDS.length} app(s)`);
	if (!process.env['TEXTQL_API_KEY']) console.warn('TEXTQL_API_KEY is not set — requests will 503.');
	if (!APP_IDS.length) console.warn('TEXTQL_APP_IDS is not set — there is nothing to list.');
	void reportUnresolved();
});
