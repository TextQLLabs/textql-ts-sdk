/**
 * Embedding a Data App with `@textql/sdk/embed`, in one file.
 *
 * The embed is `createEmbedHandler` plus `<textql-app>` in PAGE. The rest is a
 * page to put the element on and a route to hand the browser the element —
 * your app already has both, and with a bundler both go away entirely.
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

// The element styles itself — `:host` is already `display: block; height: 100%`
// — so the page's only job is giving that percentage something to resolve
// against. Charset comes from the response header, not a <meta>.
const PAGE = `<!doctype html>
<style>html, body { height: 100%; margin: 0 }</style>
<script type="module" src="/element.js"></script>

<textql-app></textql-app>

<script type="module">
	// The one optional block: app-meta needs no bridge, so the title lands
	// before the app is up. Delete it and the embed still works.
	const element = document.querySelector('textql-app');
	const title = ({ name }) => (document.title = name);
	element.addEventListener('app-meta', (event) => title(event.detail));
	if (element.meta) title(element.meta); // the fetch can beat this script
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
	console.log(`Embed demo on http://localhost:${PORT}`);
	console.log(envError ? `No env file at ${ENV_FILE}` : `Env from ${ENV_FILE}`);
	for (const name of ['TEXTQL_API_KEY', 'TEXTQL_APP_ID']) {
		if (!process.env[name]) console.warn(`${name} is not set — requests will 503.`);
	}
});
