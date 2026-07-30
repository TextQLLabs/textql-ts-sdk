/**
 * The whole backend one embedded Data App needs. `loadApp` and
 * `runComputeFunction` are the parts worth copying into your own server; the
 * rest is routing so the example runs under bare `node`.
 *
 * Three settings, all server-side: the API key, the app id, and the host. The
 * browser is never told which app it is rendering and cannot ask for another
 * one, so the API key being org-wide costs nothing here.
 */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import 'dotenv/config';
import { Textql } from '@textql/sdk';
import { TextqlError } from '@textql/sdk/models/errors';
import type { ConnectError } from '@textql/sdk/models';

// Off the 5173-5174 vite range: the other examples in this repo live there.
const PORT = Number(process.env.PORT ?? 4180);

class HttpError extends Error {
	constructor(
		readonly status: number,
		message: string
	) {
		super(message);
	}
}

type Config = { client: Textql; appId: string };

let cached: Config | undefined;

function config(): Config {
	if (!cached) {
		const apiKey = process.env.TEXTQL_API_KEY;
		const appId = process.env.TEXTQL_APP_ID;
		if (!apiKey) throw new HttpError(503, 'TEXTQL_API_KEY is not configured.');
		if (!appId) throw new HttpError(503, 'TEXTQL_APP_ID is not configured.');
		cached = {
			client: new Textql({ apiKey, serverURL: process.env.TEXTQL_SERVER_URL || undefined }),
			appId
		};
	}
	return cached;
}

/** Unary RPCs resolve to `Response | ConnectError` rather than rejecting. */
function isConnectError(response: object): response is ConnectError {
	return 'code' in response || 'details' in response;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

type AppMeta = {
	name: string;
	/**
	 * Signed, expiring, and never sent to the browser: the document is re-served
	 * from this origin by `appDocument` instead. See its comment for why.
	 */
	url: string;
	screenshotUrl: string | null;
	/** The only names this server will invoke. */
	functions: string[];
};

/**
 * Spares an invoke a second round trip. Only ever used to reject names, so a
 * stale entry can't widen what's callable beyond what the app once declared.
 */
let declaredFunctions: Set<string> | undefined;

async function loadApp(): Promise<AppMeta> {
	const { client, appId } = config();

	const result = await client.apps.get({ body: { appId } });
	if (isConnectError(result)) {
		throw new HttpError(502, result.message ?? 'Unable to load the app.');
	}

	const app = result.app;
	if (!app?.htmlUrl) {
		throw new HttpError(404, 'That app has not been rendered yet.');
	}

	const functions = (app.computeFunctions ?? [])
		.map((fn) => fn.name)
		.filter((name): name is string => !!name);
	declaredFunctions = new Set(functions);

	return {
		name: app.name?.trim() || 'Data app',
		url: app.htmlUrl,
		screenshotUrl: app.screenshotUrl?.trim() || null,
		functions
	};
}

/**
 * Re-serves the app's HTML from this origin.
 *
 * TextQL pins a Data App to the origin it was published for, in two places:
 * a `frame-ancestors` CSP header on the document (compute's
 * `pkg/remote/proxy/assets.go`), and a `window.ANA_RUNTIME_CONFIG.hostOrigin`
 * baked into the HTML at publish time (`pkg/app/shell.go`). Framed straight
 * from a third-party origin the browser refuses the document outright, and
 * even if it didn't, the runtime posts to and accepts messages from that one
 * origin only — so the bridge would be inert.
 *
 * Serving the document ourselves fixes both: our response carries no
 * `frame-ancestors`, and rewriting `hostOrigin` points the runtime's
 * postMessage at us. `<base href>` keeps every relative subresource loading
 * from the CDN, which allows `*` and whose own CSP covers that directory.
 *
 * This is the same trick as `examples/react-demo`'s `/api/preview-proxy`,
 * minus the `?url=` parameter: the app is fixed, so there is nothing for a
 * caller to point at and no SSRF surface to allowlist.
 */
async function appDocument(hostOrigin: string): Promise<string> {
	const { url } = await loadApp();

	const upstream = await fetch(url);
	if (!upstream.ok) {
		throw new HttpError(502, `The app document returned ${upstream.status}.`);
	}
	const html = await upstream.text();

	const base = `<base href="${new URL('.', url).href}">`;
	const config = `<script>window.ANA_RUNTIME_CONFIG = {hostOrigin: ${JSON.stringify(hostOrigin)}};</script>`;

	// The runtime reads the config when it evaluates, so replacing the published
	// tag in place keeps it ahead of the runtime's own script tags.
	const rewritten = html.replace(
		/<script>window\.ANA_RUNTIME_CONFIG\s*=\s*\{[^}]*\};?<\/script>/,
		config
	);
	const head = /<head[^>]*>/i.exec(rewritten);
	if (!head) return base + config + rewritten;

	const at = head.index + head[0].length;
	// Older apps publish no config tag at all; the replace above was a no-op, so
	// add one rather than letting the runtime fall back to its script's origin.
	const prefix = rewritten.includes('ANA_RUNTIME_CONFIG') ? base : base + config;
	return rewritten.slice(0, at) + prefix + rewritten.slice(at);
}

async function runComputeFunction(body: unknown) {
	if (!isRecord(body) || typeof body.name !== 'string' || !body.name) {
		throw new HttpError(400, 'Expected a JSON body of { name, params }.');
	}

	// The iframe can post any name it likes; without this the endpoint is a
	// generic runner for anything the org's key can reach.
	if (!declaredFunctions) await loadApp();
	if (!declaredFunctions?.has(body.name)) {
		throw new HttpError(403, `${body.name} is not a compute function of this app.`);
	}

	const { client, appId } = config();
	const result = await client.apps.invokeComputeFunction({
		body: {
			appId,
			functionName: body.name,
			paramsJson: JSON.stringify(body.params ?? {})
		}
	});
	if (isConnectError(result)) {
		throw new HttpError(502, result.message ?? `${body.name} failed.`);
	}

	const raw = result.resultJson ?? 'null';
	try {
		return { result: JSON.parse(raw) as unknown };
	} catch {
		return { result: raw };
	}
}

// ─── plumbing ───────────────────────────────────────────────────────────────

const STATIC_DIR = fileURLToPath(new URL('./public/', import.meta.url));
const MIME: Record<string, string> = {
	'.html': 'text/html; charset=utf-8',
	'.js': 'text/javascript; charset=utf-8',
	'.css': 'text/css; charset=utf-8'
};

async function readBody(stream: AsyncIterable<Buffer>): Promise<unknown> {
	const chunks: Buffer[] = [];
	for await (const chunk of stream) chunks.push(chunk);
	if (chunks.length === 0) return null;
	try {
		return JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown;
	} catch {
		throw new HttpError(400, 'Request body must be JSON.');
	}
}

const server = createServer((req, res) => {
	void (async () => {
		const path = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`).pathname;

		const send = (status: number, body: unknown) => {
			res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
			res.end(JSON.stringify(body));
		};

		try {
			if (path === '/textql/app' && req.method === 'GET') {
				const { name, screenshotUrl, functions } = await loadApp();
				return send(200, { name, screenshotUrl, functions });
			}

			if (path === '/textql/app/document' && req.method === 'GET') {
				const proto = String(req.headers['x-forwarded-proto'] ?? '').split(',')[0] || 'http';
				const html = await appDocument(`${proto}://${req.headers.host}`);
				res.writeHead(200, {
					'content-type': 'text/html; charset=utf-8',
					// Untrusted app HTML now served from our origin: without this it
					// would be same-origin with the host page.
					'content-security-policy': 'sandbox allow-scripts',
					'cache-control': 'no-store'
				});
				return res.end(html);
			}

			if (path === '/textql/app/compute' && req.method === 'POST') {
				return send(200, await runComputeFunction(await readBody(req)));
			}

			if (req.method === 'GET') {
				const file = path === '/' ? 'index.html' : path.slice(1);
				if (!file.includes('..')) {
					const contents = await readFile(join(STATIC_DIR, file)).catch(() => null);
					if (contents) {
						res.writeHead(200, {
							'content-type': MIME[extname(file)] ?? 'application/octet-stream'
						});
						return res.end(contents);
					}
				}
			}

			send(404, { error: 'Not found.' });
		} catch (cause) {
			if (cause instanceof HttpError) return send(cause.status, { error: cause.message });
			console.error(`${req.method} ${path}`, cause);
			// A non-2xx from TextQL throws instead of returning the union above.
			if (cause instanceof TextqlError) {
				return send(cause.statusCode, { error: `TextQL returned ${cause.statusCode}.` });
			}
			send(500, { error: 'Something went wrong.' });
		}
	})();
});

server.listen(PORT, () => {
	console.log(`Embed demo on http://localhost:${PORT}`);
	for (const name of ['TEXTQL_API_KEY', 'TEXTQL_APP_ID']) {
		if (!process.env[name]) console.warn(`${name} is not set — requests will 503.`);
	}
});
