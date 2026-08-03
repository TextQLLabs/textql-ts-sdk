# Embed a list of Data Apps

Several apps, a list to pick from, and the app itself in place. The multi-app
form of [`embed-app`](../embed-app), which is the same thing for one app and
smaller.

The element cannot tell the server which app to render — `api-base` is
concatenated with the route suffix, so a query string there produces
`/api/textql?app=x/app` and matches nothing. Path segments are the only lever
the browser has, so mount one handler per app:

```ts
const handlers = new Map(
	Object.entries(APPS).map(([key, appId]) => [
		key,
		toNodeHandler(createEmbedHandler({ appId, basePath: `/api/textql/${key}` }))
	])
);
```

and point the element at one of them:

```html
<textql-app api-base="/api/textql/app-1"></textql-app>
```

`APPS` maps a URL segment to an app ID. That map is the allowlist, and the IDs
never leave the server.

## Run it

Credentials come from the **repo root** `.env`, shared with the other examples —
there is no per-example env file:

```sh
TEXTQL_API_KEY=...      # Settings → Developers → API Keys (must reach every app)
TEXTQL_APP_IDS=...      # the apps to list, comma-separated; falls back to TEXTQL_APP_ID
TEXTQL_SERVER_URL=...   # on-prem only; the plain host, the SDK appends /rpc/public
```

```sh
npm run build          # from the repo root; examples link to esm/
cd examples/embed-list
npm install
npm run dev
```

Open `http://localhost:4181`. The server prints each mount and the app behind it
on startup. The IDs are read once, at startup — a new app in `TEXTQL_APP_IDS`
needs a restart, but a change to an app itself only needs a browser refresh.

## What to look at

`server.ts` is the whole thing. Three parts:

- **`APPS` and `handlers`** — the allowlist, and one handler per app built once.
  Each lazily builds its own SDK client, so building them per request is wasted
  work. Never resolve an ID straight out of the path: the API key is org-wide,
  so a passthrough renders *any* app in the org.
- **The dispatch in `createServer`** — it picks the handler by path segment
  rather than offering the request to each in turn. `toNodeHandler` drains the
  body to build a `Request`, so a handler that declines a `POST` has already
  eaten it, and `POST /compute` would arrive empty at the next one.
- **`list()` in the page script** — cards read `GET {basePath}/app`, the same
  route the element calls, which returns only `{ name, screenshotUrl,
  functions }`. The list needs no route of its own.

Nothing here authorizes anyone. `createEmbedHandler` takes an `authorize` hook
per app, which is where a real host answers "may this caller see *this* app":

```ts
createEmbedHandler({ appId, basePath: `/api/textql/${key}`, authorize: (request) => canView(request, key) });
```

Everything else — the routes the handler serves, why the app document is
re-served from your origin, React/Svelte/Express snippets — is in
[`EMBED.md`](../../EMBED.md).
