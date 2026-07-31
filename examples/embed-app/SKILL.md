---
name: textql-embed
description: Set up a TextQL Data App embed in a web application — the server handler, the browser element, access control, and on-prem/CSP configuration. Use when the user wants to embed a TextQL Data App, or mentions @textql/sdk/embed, createEmbedHandler, or <textql-app>.
---

# Embed a TextQL Data App

Two pieces: one catch-all route on the user's server (the only place the API key
lives) and one element in their page. Everything else is configuration.

## Ask first, then build

Do not scaffold before asking. Each answer changes the code you write. Ask these
as one batch, propose a default for each, and wait for the reply.

1. **Server framework?** Next.js App Router / Next.js Pages / SvelteKit / Remix /
   Express / Fastify / bare `node:http` / other. Determines the route shape.
2. **Browser layer?** React, or a non-React framework using the custom element.
3. **How many apps, and who picks?** One fixed app for everyone
   (`TEXTQL_APP_ID`); several fixed apps, possibly on one page; or chosen per
   request from the session/tenant. See "Rendering more than one app" — the
   answer changes the route layout, not just a config value.
4. **Who is allowed to see it?** This is not optional; see the warning below.
   Get the name of their session/auth helper so `authorize` calls the real thing.
5. **TextQL cloud or on-prem?** On-prem needs `TEXTQL_SERVER_URL`.
6. **Any CSP or restricted-network constraints?** Air-gapped or strict-CSP
   deployments change how the element is served. Skip if they say no.

If they answer only some, use these defaults and say which you assumed:
Next.js App Router · React · fixed `TEXTQL_APP_ID` · cloud · no CSP constraints.
Never default question 4.

## Install

```bash
npm install @textql/sdk
```

Version floors: server handler v1.3.8+, `<TextqlApp />` v1.4.0+,
`TEXTQL_SERVER_URL` v1.4.1+.

Two environment variables, server-side only:

```bash
TEXTQL_API_KEY=...   # Settings → Developers → API Keys (admin only)
TEXTQL_APP_ID=...    # from the app's URL in TextQL: /app/<id>
```

## Preflight: prove the configuration before writing routes

Run this **first**, before wiring anything. Checking that the variables merely
exist is not enough — a present-but-wrong key, an app ID from another org, an
app that has never been rendered, and a silently-ignored `TEXTQL_SERVER_URL` all
pass a presence check and then fail later as an opaque 503, 404, or 502.

Write `preflight.mjs` in the project root:

```js
// Run: node --env-file=.env preflight.mjs   (Node 20.6+)
import { Textql } from "@textql/sdk";

const ok = (m) => console.log(`ok    ${m}`);
const fail = (m) => { console.error(`FAIL  ${m}`); process.exitCode = 1; };

const key = process.env.TEXTQL_API_KEY;
const appId = process.env.TEXTQL_APP_ID;
const serverURL = process.env.TEXTQL_SERVER_URL;

key ? ok(`TEXTQL_API_KEY set (${key.length} chars)`)
    : fail("TEXTQL_API_KEY unset — every request will 503");
appId ? ok(`TEXTQL_APP_ID=${appId}`)
      : fail("TEXTQL_APP_ID unset — every request will 503");
serverURL?.includes("/rpc/public")
  ? fail("TEXTQL_SERVER_URL must be the plain host; the SDK appends /rpc/public")
  : ok(`TEXTQL_SERVER_URL ${serverURL ?? "unset → app.textql.com (correct for cloud)"}`);
if (process.exitCode) process.exit(1);

// Record where the request actually goes. This is what catches an on-prem host
// that is set but ignored — the check above cannot tell you that.
let target;
const inner = globalThis.fetch;
globalThis.fetch = (input, init) => {
  target ??= typeof input === "string" ? input : input.url;
  return inner(input, init);
};

let result;
try {
  result = await new Textql().apps.get({ body: { appId } });
} catch (error) {
  fail(`could not reach the API: ${error.message}`);
  console.error(`      attempted: ${target ?? "(no request was made)"}`);
  process.exit(1);
}

ok(`requests go to ${target ? new URL(target).origin : "(unknown)"}`);

// Unary RPCs resolve to a ConnectError rather than rejecting.
if ("code" in result || "details" in result) {
  fail(`API rejected the call: ${result.message ?? result.code}`);
  console.error("      usually a bad or revoked TEXTQL_API_KEY");
  process.exit(1);
}
if (!result.app) {
  fail(`no app ${appId} visible to this key — wrong ID, or key from another org`);
  process.exit(1);
}

ok(`app "${result.app.name}"`);
result.app.htmlUrl
  ? ok("app is rendered — {basePath}/document will work")
  : fail("app has never been rendered — {basePath}/document will 404");

const fns = (result.app.computeFunctions ?? []).map((f) => f.name).filter(Boolean);
ok(fns.length ? `compute functions: ${fns.join(", ")}` : "no compute functions (fine)");
```

Every line is conclusive: it either names the misconfiguration or confirms the
thing works. Do not proceed until it exits 0. Report its output verbatim rather
than summarising it.

## Server: one catch-all route

Next.js App Router:

```ts
// app/api/textql/[...path]/route.ts
import { createEmbedHandler } from "@textql/sdk/embed";

export const { GET, POST } = createEmbedHandler();
```

Express, Fastify, or bare `node:http` — these predate the Web `Request` object,
so wrap it:

```ts
import { createEmbedHandler, toNodeHandler } from "@textql/sdk/embed";

const embed = toNodeHandler(createEmbedHandler());

app.use(async (req, res, next) => {
  if (!(await embed(req, res))) next();
});
```

The handler serves three routes under `basePath` and returns `null` for anything
else, so it composes with existing routing:

| Route | |
| --- | --- |
| `GET {basePath}/app` | name, screenshot, and declared compute functions |
| `GET {basePath}/document` | the app's HTML, re-served from your origin |
| `POST {basePath}/compute` | runs one declared compute function |

## Access control — do not skip

> The API key is org-wide, so it stays on the server and the browser talks only
> to these routes. It is never told which app it renders and cannot ask for a
> different one. **But nothing in the handler knows who the caller is.** Without
> an `authorize` hook the app is visible to anyone who can reach the route.

Wire it to their real session check:

```ts
export const { GET, POST } = createEmbedHandler({
  authorize: async (request) => (await getSession(request)) !== null,
});
```

Return `false` or throw to reject.

## Browser

React — prefer this over the raw tag. JSX has no type for a custom element, and
React cannot bind the events because they are `CustomEvent`s:

```tsx
import { TextqlApp } from "@textql/sdk/embed/react";

export default function Page() {
  return <TextqlApp style={{ height: "80vh" }} />;
}
```

Props: `apiBase` (defaults to `/api/textql`), `className`, `style`, `onMeta`,
`onReady`, `onError`.

> **Never import `@textql/sdk/embed/element` directly in a Next.js app.** It
> defines a class extending `HTMLElement` at module scope, so importing it on a
> server throws `HTMLElement is not defined` — including inside a `"use client"`
> component, which Next.js still renders on the server. `<TextqlApp />` carries
> the directive and loads the element in an effect.

Anywhere else, use the element directly:

```svelte
<script>import "@textql/sdk/embed/element";</script>
<textql-app style="height: 80vh" />
```

Outside React the same three events are `CustomEvent`s on the element, and
`element.meta` holds the metadata for a listener that attached late:

```ts
element.addEventListener("app-meta", (event) => setTitle(event.detail.name));
```

## Sizing

The element has no intrinsic size, like an iframe. Data Apps also lay out
against the full viewport — the same region they get inside TextQL — so a narrow
content column breaks the app's own layout, not the element. Full-bleed width
and a real height are the safe defaults.

## Rendering more than one app

**The element cannot tell the server which app to render, by design.** Its
`api-base` is concatenated with the route suffix, so a query string there
(`/api/textql?app=x`) produces `/api/textql?app=x/app`, which matches nothing
and 404s. Path segments are the only lever the browser has. Pick by who decides:

**1 — The server decides from the session.** One handler, one URL, a different
app per user or tenant. Safest: the client has no say.

```ts
export const { GET, POST } = createEmbedHandler({
  appId: async (request) => (await getTenant(request)).textqlAppId,
});
```

**2 — A handful of fixed apps.** One handler each, on its own `basePath`.

```ts
// app/api/textql/sales/[...path]/route.ts
export const { GET, POST } = createEmbedHandler({
  appId: SALES_APP_ID,
  basePath: "/api/textql/sales",
  authorize: canViewSales,
});
```

```tsx
<TextqlApp apiBase="/api/textql/sales" style={{ height: "80vh" }} />
<TextqlApp apiBase="/api/textql/ops"   style={{ height: "80vh" }} />
```

Nested base paths are safe: a handler mounted at `/api/textql` computes the
suffix `/sales/app` for that route, matches none of its three, and returns
`null` rather than stealing it. Several embeds on one page each fetch
independently.

**3 — The client picks by path.** Map an opaque key to an ID through an
allowlist, and cache the handlers — each lazily builds its own SDK client, so
constructing one per request is wasted work.

```ts
const APPS: Record<string, string> = { sales: "…", ops: "…" };
const handlers = new Map<string, ReturnType<typeof createEmbedHandler>>();

function handlerFor(key: string) {
  if (!(key in APPS)) return null; // allowlist, never passthrough
  if (!handlers.has(key)) {
    handlers.set(key, createEmbedHandler({
      appId: APPS[key],
      basePath: `/api/textql/${key}`,
      authorize: (request) => canView(request, key),
    }));
  }
  return handlers.get(key) ?? null;
}

async function route(request: Request, ctx: { params: Promise<{ app: string }> }) {
  const handler = handlerFor((await ctx.params).app);
  if (!handler) return new Response("Unknown app", { status: 404 });
  return (await handler(request)) ?? new Response("Not found", { status: 404 });
}

export { route as GET, route as POST };
```

> Never write `appId: (request) => new URL(request.url).pathname.split("/").pop()`.
> The API key is org-wide, so a passthrough turns the route into an oracle that
> renders **any** app in the org. Authorize against the key, not the resolved ID.

The app ID is not a credential — nothing can be done with one without the org's
API key, and the browser never receives it (`{basePath}/app` returns only
`name`, `screenshotUrl`, and `functions`). Hardcoding it server-side is fine.
The rule is only that the *server* must decide which app it is.

## On-prem

```bash
TEXTQL_SERVER_URL=https://textql.internal.example.com
```

The **plain host** — the SDK appends `/rpc/public` itself. Every client reads it
from v1.4.1+. On earlier versions it is ignored and the SDK silently defaults to
`app.textql.com`; pass a configured client instead:

```ts
createEmbedHandler({ client: new Textql({ serverURL }) });
```

## Restricted networks and CSP

Without a bundler, serve the element from the user's own origin rather than a
CDN. It is one self-contained file that imports nothing:

```bash
cp node_modules/@textql/sdk/esm/embed/element.js public/vendor/textql-element.js
```

```html
<script type="module" src="/vendor/textql-element.js"></script>
<textql-app></textql-app>
```

A pinned CDN URL is fine for a prototype, but do not ship it to a restricted
network: it puts a third-party host in `script-src`, adds an outbound request on
every page load, and does not resolve air-gapped.

With the element self-hosted, the host page needs `script-src 'self'`,
`frame-src 'self'` (the iframe's `src` is their own `{basePath}/document`),
`style-src 'unsafe-inline'` (the element writes its shadow-DOM stylesheet as an
inline `<style>`), and the asset origin in `img-src` for the poster screenshot.

Before promising air-gapped: `rehostDocument` re-serves the entry document from
their origin, but the scripts and styles **inside** it still load from wherever
their instance stores rendered apps — their own object storage on-prem, TextQL's
CDN against cloud.

## Compute functions

Apps that compute call back through the user's server. The handler relays them
to `POST {basePath}/compute` and **refuses any function name the app does not
declare**, so the route cannot become a generic runner. Declared names arrive as
`functions` on `onMeta`; `GET {basePath}/app` lists them.

TextQL rate-limits compute server-side and returns `resource_exhausted`. A
production host should retry that with backoff.

## Verify the running integration

Once the route is mounted, with the server running:

```sh
curl -s localhost:3000/api/textql/app          # name + declared functions
curl -sI localhost:3000/api/textql/document    # 200, content-security-policy: sandbox allow-scripts
```

Then, in order:

1. The page renders the app — not the spinner, not the error overlay.
2. **Signed out, the route rejects.** Actually test it; do not assume the
   `authorize` hook is wired. This is the one failure that looks fine locally
   and leaks the app in production.
3. `onError` is handled, not just `onMeta`.
4. The API key appears nowhere in the client bundle — grep the built output for
   both the key itself and `TEXTQL_API_KEY`.

## Known failure modes

| Symptom | Cause |
| --- | --- |
| Preflight: `could not reach the API` | bad host, DNS, or firewall — check the origin it printed |
| Preflight: `API rejected the call` | bad or revoked `TEXTQL_API_KEY` |
| Preflight: `no app <id> visible to this key` | wrong `TEXTQL_APP_ID`, or key belongs to another org |
| Preflight: `app has never been rendered` | open the app in TextQL and let it render once |
| Preflight origin is `app.textql.com` on-prem | SDK older than v1.4.1, or `serverURL` set elsewhere in code |
| Everything 503s at runtime | `TEXTQL_API_KEY` / `TEXTQL_APP_ID` not reaching the server process |
| `HTMLElement is not defined` | element imported on the server; use `<TextqlApp />` |
| Element renders but stays blank/collapsed | no height set, or CSP blocked the inline `<style>` |
| 502 telling you to upgrade | the app-shell rewrite drifted; upgrade the SDK |
| Compute call rejected | the app does not declare that function name |

A runnable reference implementation is `examples/embed-app` in the
`@textql/sdk` repository — one file of bare `node`, including serving the
element off its own route.
