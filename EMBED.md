# Embedding a Data App

Render a TextQL Data App inside your own web app. Two imports and two env vars.

```sh
TEXTQL_API_KEY=...   # Settings → Developers → API Keys (must have access to corresponding data app)
TEXTQL_APP_ID=...    # from the app's URL in TextQL: /app/<id>
```

**Server** — one catch-all route:

```ts
// app/api/textql/[...path]/route.ts
import { createEmbedHandler } from '@textql/sdk/embed';

export const { GET, POST } = createEmbedHandler();
```

**Browser** — in React, one import and one tag:

```tsx
import { TextqlApp } from '@textql/sdk/embed/react';

<TextqlApp style={{ height: '80vh' }} />;
```

Anywhere else, import the custom element and use it directly:

```ts
import '@textql/sdk/embed/element';

<textql-app style="height: 80vh"></textql-app>
```

That's the whole integration. Both default to `/api/textql`, which is where
the handler mounts, so nothing needs configuring on the happy path.

## The API key never reaches the browser

The key is org-wide, so it stays on your server and the element talks only to
your routes. The browser is never told which app it renders and cannot ask for
a different one.

That also means **your routes are the access control**. Nothing here knows who
the caller is:

```ts
export const { GET, POST } = createEmbedHandler({
  authorize: async (request) => (await getSession(request)) !== null
});
```

## Options

| Option | Default | |
| --- | --- | --- |
| `appId` | `TEXTQL_APP_ID` | A function `(request, params) => string` picks per request — from a session, tenant header, or a `basePath` placeholder. |
| `appIds` | none | The apps this handler serves. Turns on the list route, and is the allowlist a `basePath` placeholder is checked against. |
| `sharedWithMe` | unset | Passed to `ListApps` by the list route. Exclusive, and about the key's member — see below. |
| `client` | built from `TEXTQL_API_KEY` / `TEXTQL_SERVER_URL` | Pass your own `Textql` instance. |
| `basePath` | `/api/textql` | Where the handler is mounted. Must match the element's `api-base`. A `:name` segment captures that part of the path. |
| `authorize` | none | Return `false` or throw to reject. |
| `rehostDocument` | `true` | See below. |

On-prem: set `TEXTQL_SERVER_URL` to the plain host; the SDK appends

## Several apps

One handler serves any number of apps. Put a placeholder in `basePath` and list
the apps in `appIds`:

```ts
const embed = createEmbedHandler({
  appIds: ["app-id-1", "app-id-2"],
  basePath: "/api/textql/:appId",
});
```

The captured segment is the app, checked against `appIds` first. That check is
the point: the API key is org-wide, so a handler that took the segment on trust
would render *any* app in the org for anyone who could guess an id. Without
either `appIds` or your own `appId` resolver, a placeholder is a 500 rather than
a passthrough.

Point the element at one of them:

```html
<textql-app api-base="/api/textql/app-id-1"></textql-app>
```

`appIds` also turns on the list route, on the static part of `basePath` — here
`/api/textql`. It answers with the apps behind those ids, in that order:

```json
[{ "id": "app-id-1", "name": "Hop Road", "screenshotUrl": "https://..." }]
```

Enough to render cards, and one request rather than one per card. `screenshotUrl`
is signed and expires, so fetch the list when you render it rather than caching
it for the day. There is no `functions` here — `ListApps` does not return them;
`GET {basePath}/app` does.

`appIds` can be a function of the request, which is where a per-user list comes
from — your own sharing table, a tenant column, whatever you already have.

### `sharedWithMe`

The list route passes this straight to `ListApps`, and it is worth knowing what
it does before you set it.

```ts
createEmbedHandler({ basePath: "/api/textql/:appId", sharedWithMe: true });
```

It **narrows** rather than widens. `true` returns only apps authored by someone
else *and* explicitly granted to you — leaving it unset already includes apps
shared with you, alongside everything else you can reach. So `true` is a
strictly smaller list than the default, never a larger one.

"You" is the member who created the API key. Keys are `member_id:token`, so
every per-caller filter on `ListApps` describes that member, never the person
looking at your page. It also reads explicit grants only, so a member who
reaches apps through a role — an admin, typically — gets an empty list from
`true` even while seeing the whole org by default. An empty list here usually
means "this member holds no grants", not "nothing is shared".

For a list that follows your *visitor*, none of this helps: pass a function to
`appIds` and answer from your own model.

`appIds` turns the list route on, and so does `sharedWithMe: true`. `false` only
declines to filter, so it never creates a list by itself — which means
`sharedWithMe: someBoolean` is safe to pass straight through from a flag.

`sharedWithMe` alone gives a read-only view: serving one of those apps still
needs `appIds`, or your own `appId` resolver, because the allowlist is what
gates the per-app routes.

App ids do reach the browser this way — they are in TextQL's own URLs too, and
the allowlist, not their secrecy, is what gates access. To keep them off the
wire anyway, resolve opaque keys in `appId` and write your own list route; the
built-in one returns real ids by definition.

```ts
const APPS: Record<string, string> = { sales: "app-id-1", ops: "app-id-2" };

createEmbedHandler({
  basePath: "/api/textql/:key",
  appId: (request, { key }) => {
    const appId = APPS[key];
    if (!appId) throw new EmbedError(404, "That app does not exist.");
    return appId;
  },
});
```

## Sizing

The element has no intrinsic size, like an iframe. Data Apps also lay out
against the full viewport — the same region they get inside TextQL — so a
narrow content column breaks the app's own layout, not the element. Full-bleed
width and a real height are the safe defaults.

## Events

| Event | Fires when | `detail` |
| --- | --- | --- |
| `app-meta` | metadata arrives | `{ name, screenshotUrl, functions }` |
| `app-ready` | the app's runtime completes its handshake | the same metadata |
| `app-error` | the app reports a runtime error | the error message |

Use `app-meta` to title your own chrome — it depends only on your server, not
on the bridge. `element.meta` holds the same value for a listener that attached
late.

`<TextqlApp />` surfaces the same three as props, so React needs no refs:

```tsx
<TextqlApp
  apiBase="/api/textql"
  style={{ height: '80vh' }}
  onMeta={(meta) => setTitle(meta.name)}
  onReady={(meta) => console.log('bridge up', meta)}
  onError={(error) => console.error(error.message)}
/>
```

## React

`@textql/sdk/embed/react` is a thin wrapper over the same element. Prefer it to
the raw tag: JSX has no type for a custom element, and React cannot bind
`app-meta` and friends because they are CustomEvents.

It is also the only safe form under SSR. `@textql/sdk/embed/element` defines a
class extending `HTMLElement` at module scope, so importing it on a server
throws `HTMLElement is not defined` — that will break a Next.js render even
inside a `'use client'` component. `<TextqlApp />` carries the `'use client'`
directive and loads the element in an effect, so it server-renders to an inert
`<textql-app>` tag and upgrades on the client. That also code-splits the
element out of your initial bundle.

`react` is an optional peer dependency; nothing else in the SDK needs it.

## Other frameworks

It's a custom element, so there is no framework binding to install.

```svelte
<script>import '@textql/sdk/embed/element';</script>
<textql-app style="height: 80vh" />
```

Express, Fastify, or bare `node:http` predate Web `Request`:

```ts
import { createEmbedHandler, toNodeHandler } from '@textql/sdk/embed';

const embed = toNodeHandler(createEmbedHandler());
app.use(async (req, res, next) => {
  if (!(await embed(req, res))) next();
});
```

Without a bundler, serve the element from the package, on a route of your own.
It is one self-contained file — it imports nothing, so serving it is a copy:

```ts
const ELEMENT_JS = createRequire(import.meta.url).resolve("@textql/sdk/embed/element");
```

```html
<script type="module" src="/element.js"></script>
<textql-app></textql-app>
```

`examples/embed-app` does exactly this in ~10 lines of bare `node`. Serving it
yourself keeps the version pinned in your lockfile, where your existing review
and scanning already look. A CDN saves the route for a prototype:

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/@textql/sdk@1.4.1/esm/embed/element.js"></script>
```

Pin the version if you do, and don't ship that form to a restricted network: it
puts a third-party host in your `script-src`, adds an outbound request on every
page load, and does not resolve air-gapped.

## Why the document is served from your origin

TextQL pins a published app to the one origin it was published for, twice over:

| Pin | Set by | Effect elsewhere |
| --- | --- | --- |
| `frame-ancestors` CSP header | `PREVIEW_CSP` / `WEB_URL` | the browser refuses to frame the document at all |
| `ANA_RUNTIME_CONFIG.hostOrigin`, baked into the HTML at publish time | `WEB_URL` | the only origin the app's runtime will `postMessage` or accept messages from, so the bridge is inert |

So `GET {basePath}/document` fetches the app's HTML server-side and re-serves it
from your origin: your response carries no `frame-ancestors`, and `hostOrigin`
is rewritten to your origin. A `<base href>` keeps every subresource loading
from the CDN, which already serves them with `Access-Control-Allow-Origin: *`.

**This is a workaround.** Costs worth knowing:

- Every document load proxies through your server, `no-store`, so the entry
  document is not CDN-cached. Subresources still are.
- The rewrite is pinned to a string literal emitted by TextQL's app shell. If
  that shape changes, the handler throws a 502 telling you to upgrade rather
  than serving a document whose bridge will never connect.
- The document response carries `content-security-policy: sandbox
  allow-scripts`. Untrusted third-party HTML is being served from *your*
  origin; that header is what keeps it out of your cookies and `localStorage`.
  If you reimplement this route, keep it.

Set `rehostDocument: false` to point the iframe straight at the signed CDN URL
instead. That is the better path, and it works once your origin is allowed
platform-side — at which point this whole section goes away.

## On-premise and restricted networks

Nothing in the integration needs a TextQL-operated origin at runtime. Point the
handler at your instance and serve the element yourself, and every host the
browser reaches is one you run:

```sh
TEXTQL_SERVER_URL=https://textql.internal.example.com
```

Every client reads it — the embed handler, a bare `new Textql()`, and
`createStreamingClient` — so the host is named once rather than at each
construction site. An explicit `serverURL` still wins. The plain host is what
belongs there; the RPC prefix hook appends `/rpc/public`.

| What the browser loads | From |
| --- | --- |
| the element script | your origin, served off the resolved package path |
| `{basePath}/app`, `/document`, `/compute` | your origin — the handler's per-app routes |
| `{listPath}`, with `appIds` set | your origin — the list route |
| the app document's subresources | the asset origin your instance signs URLs for, via the injected `<base href>` |
| the poster screenshot, before the app loads | the same asset origin |

Check that last pair before assuming air-gapped. `rehostDocument` re-serves the
entry document from your origin, but the scripts and styles inside it still load
from wherever your instance stores rendered apps — your own object storage
on-prem, TextQL's CDN against cloud.

With the element self-hosted and `rehostDocument` on, the host page needs
`script-src 'self'` and `frame-src 'self'` -- the iframe's `src` is your own
`{basePath}/document` -- plus `style-src 'unsafe-inline'`, because the element
writes its shadow-DOM stylesheet as an inline `<style>`. Add the asset origin to
`img-src` for the poster.

## What the bridge leaves out

The full host inside TextQL also carries per-member state, activity logging,
presence, deep-link routing, realtime sockets, and asking the agent. The
element declares all of them off in its `hello`, which is a supported
configuration. Apps that render data and call compute functions work unchanged;
apps built around member state render but lose those features.

Compute calls are relayed through `POST {basePath}/compute`, which refuses any
function name the app does not declare. TextQL rate-limits compute server-side
and returns `resource_exhausted`; a production host should retry that with
backoff.
