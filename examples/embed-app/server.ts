/**
 * Embedding a Data App with `@textql/sdk/embed`.
 *
 * The embed routes are one line. Everything else here is a static file server
 * so the example runs under bare `node` — your app already has one.
 */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import 'dotenv/config';
import { createEmbedHandler, toNodeHandler } from '@textql/sdk/embed';

const PORT = Number(process.env.PORT ?? 4180);

// Reads TEXTQL_API_KEY, TEXTQL_APP_ID and (on-prem) TEXTQL_SERVER_URL.
const embed = toNodeHandler(createEmbedHandler());

const STATIC_DIR = fileURLToPath(new URL('./public/', import.meta.url));

// No bundler here, so serve the element straight out of the package. With a
// bundler this is just `import '@textql/sdk/embed/element'`.
const ELEMENT_JS = createRequire(import.meta.url).resolve('@textql/sdk/embed/element');
const MIME: Record<string, string> = {
	'.html': 'text/html; charset=utf-8',
	'.js': 'text/javascript; charset=utf-8'
};

const server = createServer((req, res) => {
	void (async () => {
		if (await embed(req, res)) return;

		const path = new URL(req.url ?? '/', `http://${req.headers.host}`).pathname;
		if (path === '/element.js') {
			res.writeHead(200, { 'content-type': 'text/javascript; charset=utf-8' });
			return res.end(await readFile(ELEMENT_JS));
		}

		if (req.method === 'GET' && !path.includes('..')) {
			const file = path === '/' ? 'index.html' : path.slice(1);
			const contents = await readFile(join(STATIC_DIR, file)).catch(() => null);
			if (contents) {
				res.writeHead(200, {
					'content-type': MIME[extname(file)] ?? 'application/octet-stream'
				});
				return res.end(contents);
			}
		}

		res.writeHead(404, { 'content-type': 'application/json' });
		res.end(JSON.stringify({ error: 'Not found.' }));
	})();
});

server.listen(PORT, () => {
	console.log(`Embed demo on http://localhost:${PORT}`);
	for (const name of ['TEXTQL_API_KEY', 'TEXTQL_APP_ID']) {
		if (!process.env[name]) console.warn(`${name} is not set — requests will 503.`);
	}
});
