/**
 * Embedding several Data Apps with `@textql/sdk/embed`: a list, then the app.
 *
 * The element cannot tell the server which app to render, so path segments are
 * the only lever the browser has — one `createEmbedHandler` per app, each on
 * its own `basePath`, and `api-base` picks between them. See `examples/embed-app`
 * for the single-app version, which is smaller.
 */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

import { config } from 'dotenv';
import { createEmbedHandler, toNodeHandler } from '@textql/sdk/embed';

// The SDK repo's root .env, shared by every example. Resolved from this file
// rather than the cwd, so it does not matter where you launch from.
const ENV_FILE = fileURLToPath(new URL('../../.env', import.meta.url));
const { error: envError } = config({ path: ENV_FILE, override: true });

const PORT = Number(process.env.PORT ?? 4181);
const API_BASE = '/api/textql';

// Keyed by the segment that appears in the URL. This map is the allowlist and
// the keys are all the browser ever sees; never resolve an ID out of the path,
// or the org-wide key makes the route an oracle for every app in the org.
const APPS: Record<string, string> = Object.fromEntries(
	(process.env.TEXTQL_APP_IDS ?? process.env.TEXTQL_APP_ID ?? '')
		.split(',')
		.map((id) => id.trim())
		.filter(Boolean)
		.map((id, index) => [`app-${index + 1}`, id])
);

const handlers = new Map(
	Object.entries(APPS).map(([key, appId]) => [
		key,
		toNodeHandler(createEmbedHandler({ appId, basePath: `${API_BASE}/${key}` }))
	])
);

const ELEMENT_JS = createRequire(import.meta.url).resolve('@textql/sdk/embed/element');

// The list and the app are one page. Cards read `{basePath}/app` — the same
// route the element calls — so the list needs no server route of its own.
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
	.card small { display: block; font-weight: 400; color: #6b7280; }
	textql-app { height: 100% }
</style>

<header>
	<a id="back" href="#" hidden>&larr; All apps</a>
	<h1 id="title">Data apps</h1>
</header>
<main id="main"></main>

<script type="module" src="/element.js"></script>
<script type="module">
	const KEYS = __KEYS__;
	const main = document.querySelector('#main');
	const title = document.querySelector('#title');
	const back = document.querySelector('#back');

	const apiBase = (key) => \`${API_BASE}/\${key}\`;

	function list() {
		const grid = document.createElement('div');
		grid.className = 'grid';

		for (const key of KEYS) {
			const card = document.createElement('button');
			card.className = 'card';
			card.innerHTML = '<div class="blank"></div><p>Loading&hellip;</p>';
			card.addEventListener('click', () => (location.hash = key));
			grid.append(card);

			fetch(\`\${apiBase(key)}/app\`)
				.then((response) => response.json())
				.then((meta) => {
					if (meta.error) throw new Error(meta.error);
					const poster = meta.screenshotUrl
						? \`<img src="\${meta.screenshotUrl}" alt="">\`
						: '<div class="blank"></div>';
					const functions = meta.functions.length === 1
						? '1 compute function'
						: \`\${meta.functions.length} compute functions\`;
					card.innerHTML = \`\${poster}<p></p>\`;
					card.querySelector('p').append(meta.name, Object.assign(
						document.createElement('small'), { textContent: functions }
					));
				})
				.catch((cause) => (card.querySelector('p').textContent = cause.message));
		}

		title.textContent = 'Data apps';
		back.hidden = true;
		main.replaceChildren(grid);
	}

	function app(key) {
		// A fresh element rather than retargeting the old one, so api-base is set
		// before it is inserted and its first load is already the right app.
		const element = document.createElement('textql-app');
		element.setAttribute('api-base', apiBase(key));
		element.addEventListener('app-meta', ({ detail }) => (title.textContent = detail.name));

		title.textContent = 'Loading\\u2026';
		back.hidden = false;
		main.replaceChildren(element);
	}

	const route = () => {
		const key = location.hash.slice(1);
		KEYS.includes(key) ? app(key) : list();
	};
	addEventListener('hashchange', route);
	route();
</script>
`.replace('__KEYS__', JSON.stringify(Object.keys(APPS)));

const server = createServer((req, res) => {
	void (async () => {
		const path = new URL(req.url ?? '/', `http://${req.headers.host}`).pathname;

		// Dispatched on the segment rather than offered to each handler in turn:
		// toNodeHandler drains the body to build a `Request`, so a handler that
		// declines a POST has already eaten it.
		const segment = path.startsWith(`${API_BASE}/`) && path.slice(API_BASE.length + 1).split('/')[0];
		const handler = segment ? handlers.get(segment) : undefined;
		if (handler && (await handler(req, res))) return;

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
	for (const [key, appId] of Object.entries(APPS)) console.log(`  ${API_BASE}/${key} → ${appId}`);
	if (!process.env['TEXTQL_API_KEY']) console.warn('TEXTQL_API_KEY is not set — requests will 503.');
	if (!Object.keys(APPS).length) console.warn('TEXTQL_APP_IDS is not set — there is nothing to list.');
});
