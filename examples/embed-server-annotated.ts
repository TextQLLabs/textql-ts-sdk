/**
 * The same thing `examples/embed-list/server.ts` does, with the layering spelled
 * out instead of implied. Nothing here is new capability — it is the wiring.
 *
 * THE ONE IDEA: the TextQL client lives INSIDE your Node server. The browser
 * never talks to TextQL and never sees the API key. It only ever calls your own
 * origin, and your server makes the real calls on its behalf.
 *
 *   ┌─ browser ──────────────────┐
 *   │ <textql-app                │
 *   │   api-base="/api/textql/x" │   your origin only — no key, no TextQL host
 *   └────────────┬───────────────┘
 *                │  GET  /api/textql/x/app
 *                │  GET  /api/textql/x/document
 *                │  POST /api/textql/x/compute
 *                ▼
 *   ┌─ your node server (this file) ─────────────────────────┐
 *   │  createServer(...)                                     │  1. your routes
 *   │    └── embed(req, res)      toNodeHandler(...)         │  2. adapter
 *   │          └── handler        createEmbedHandler({...})  │  3. routing + authz
 *   │                └── client   new Textql({ apiKey })     │  4. holds the key
 *   └───────────────────────────┬────────────────────────────┘
 *                               │  tql_api_key: <key>
 *                               ▼
 *                        TextQL server
 *
 * Read the nesting in reverse to see why each layer exists:
 *   4. `client` is the only thing that knows the API key and the TextQL host.
 *   3. `handler` owns the four routes, and decides WHICH app this caller may see.
 *   2. `toNodeHandler` adapts Web `Request`/`Response` to node's `req`/`res`.
 *   1. your server tries the embed routes first, then falls through to your own.
 */
import { createServer } from 'node:http';

import { Textql } from '@textql/sdk';
import { createEmbedHandler, toNodeHandler } from '@textql/sdk/embed';

// ── 4. The client. Server-side only. ───────────────────────────────────────────
// This object holds the credential. It is constructed once, here, and is never
// serialised, never sent to the browser, and never reachable from it.
const client = new Textql({
	apiKey: () => getApiKey(),                 // per-request resolver; see the reference file
	serverURL: process.env.TEXTQL_SERVER_URL,  // plain host; the SDK appends /rpc/public
});

// ── 3. The handler. Routing plus the two authorization questions. ──────────────
// `createEmbedHandler` returns a plain `(Request) => Promise<Response | null>`.
// The `null` is what makes it composable: it means "not my route, you handle it."
const handler = createEmbedHandler({
	// The client from step 4 is captured here. THIS is the embedding — from now on
	// every route below makes its TextQL calls through this client, with this key.
	// Omit it and the handler silently builds its own from environment variables.
	client,

	// Where these routes live on YOUR origin. `:appId` is a placeholder, so one
	// handler serves many apps. It must match the element's `api-base` exactly.
	basePath: '/api/textql/:appId',

	// "Is this caller allowed in at all?" Nothing else in the handler knows who
	// the caller is, so without this the routes are open to anyone who can reach
	// your server.
	authorize: async (request) => (await resolveSession(request)) !== null,

	// "Which apps may this caller see?" Called per request. Doubles as the
	// allowlist the `:appId` placeholder is checked against — anything not in the
	// returned array is a 404. The API key is org-wide, so this is the only thing
	// stopping a guessed id from rendering any app in the org.
	appIds: async (request) => {
		const user = await resolveSession(request);
		return user ? await entitledAppIds(user) : [];
	},
});

// ── 2. The adapter. ────────────────────────────────────────────────────────────
// `handler` speaks Web `Request`/`Response`; `node:http` and Express predate
// those. This wraps it and resolves `false` when the route was not ours.
const embed = toNodeHandler(handler);

// ── 1. Your server. ────────────────────────────────────────────────────────────
const server = createServer((req, res) => {
	void (async () => {
		// Try the embed routes first. Four paths are handled, all under basePath:
		//
		//   GET  /api/textql/:appId/app       → { name, screenshotUrl, functions }
		//   GET  /api/textql/:appId/document  → the app's HTML, from your origin
		//   POST /api/textql/:appId/compute   → { result }
		//   GET  /api/textql                  → [{ id, name, screenshotUrl }]
		//
		// Each one calls TextQL through `client` and returns only what the browser
		// needs. The key stays on this side of the boundary in every case.
		if (await embed(req, res)) return;

		// Not an embed route — carry on with your own application.
		res.writeHead(404, { 'content-type': 'application/json' });
		res.end(JSON.stringify({ error: 'Not found.' }));
	})();
});

server.listen(8080);

/*
 * WHAT THE BROWSER SEES
 *
 * The custom element is pointed at your origin, and that is the whole contract:
 *
 *   <script type="module" src="/element.js"></script>
 *   <textql-app api-base="/api/textql/app_123"></textql-app>
 *
 * `api-base` is a path on YOUR server. There is no key attribute, no TextQL
 * hostname, and no token in the page. Open devtools on the embedded page and
 * every request goes to your origin.
 *
 * Wrong app id in `api-base`? The `appIds` resolver above does not return it, so
 * it 404s — the browser cannot widen its own access by editing the attribute.
 */
