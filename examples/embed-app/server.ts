/**
 * Embedding a Data App with `@textql/sdk/embed`, in one file.
 *
 * The embed is `createEmbedHandler` plus `<textql-app>` in PAGE. The rest is a
 * page to put the element on and a route to hand the browser the element —
 * your app already has both.
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

const PORT = Number(process.env.PORT ?? 4180);

const embed = toNodeHandler(createEmbedHandler());

const ELEMENT_JS = createRequire(import.meta.url).resolve('@textql/sdk/embed/element');

const PAGE = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Embedded Data App</title>
<script type="module" src="/element.js"></script>
<style>
	html, body { height: 100%; }
	body {
		margin: 0;
		display: flex;
		flex-direction: column;
		font: 15px/1.6 system-ui, -apple-system, sans-serif;
		color: #111827;
		background: #fff;
	}
	header {
		flex: none;
		padding: 12px 20px;
		border-bottom: 1px solid #e5e7eb;
	}
	h1 { font-size: 15px; font-weight: 600; margin: 0; }
	/* Data Apps lay out against the full viewport; a narrow column breaks the
	   app's own layout, not this page. */
	textql-app { flex: 1; min-height: 0; }
</style>
</head>
<body>
	<header>
		<h1 id="title">Loading…</h1>
	</header>

	<textql-app></textql-app>

	<script type="module">
		const element = document.querySelector('textql-app');
		const title = document.getElementById('title');

		function showName({ name }) {
			title.textContent = name;
			document.title = name;
		}

		// The fetch can land before this script parses.
		element.addEventListener('app-meta', (event) => showName(event.detail));
		if (element.meta) showName(element.meta);
	</script>
</body>
</html>
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
	console.log(`Embed demo on http://localhost:${PORT}`);
	console.log(envError ? `No env file at ${ENV_FILE}` : `Env from ${ENV_FILE}`);
	for (const name of ['TEXTQL_API_KEY', 'TEXTQL_APP_ID']) {
		if (!process.env[name]) console.warn(`${name} is not set — requests will 503.`);
	}
});
