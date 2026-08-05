# Embed a list of Data Apps

Several apps, a list to pick from, and the app itself in place. The multi-app
form of [`embed-app`](../embed-app), which is the same thing for one app and
smaller.

One handler serves all of them. `basePath` carries a placeholder, so the segment
in the path picks the app, and `appIds` is what that segment is checked against:

```ts
const embed = createEmbedHandler({
	appIds: APP_IDS,
	basePath: '/api/textql/:appId'
});
```

That check is the whole security model here. The API key is org-wide, so a
handler that took the segment on trust would render *any* app in the org.

`appIds` also turns on the list route at `/api/textql`, which is where the cards
come from — one request for the whole grid, rather than one per card.

## Run it

Credentials come from the **repo root** `.env`, shared with the other examples —
there is no per-example env file:

```sh
TEXTQL_API_KEY=...      # Settings → Developers → API Keys (must reach every app)
TEXTQL_APP_IDS=...      # the apps to list, comma-separated; falls back to TEXTQL_APP_ID
TEXTQL_SERVER_URL=...   # on-prem only; the plain host, the SDK appends /rpc/public
TEXTQL_SHARED_WITH_ME=1 # optional; narrows the list, see below. Expect an empty grid.
```

```sh
npm run build          # from the repo root; examples link to esm/
cd examples/embed-list
npm install
npm run dev
```

Open `http://localhost:4181`. The ids are read once, at startup — a new app in
`TEXTQL_APP_IDS` needs a restart, but a change to an app itself only needs a
browser refresh.

## What to look at

`server.ts` is the whole thing, and most of it is the page. Three parts:

- **The handler** — one of them, built once, holding one SDK client. Everything
  that distinguishes the apps is `appIds` plus the `:appId` placeholder.
- **`GET /api/textql`** — the SDK's list route, returning
  `[{ id, name, screenshotUrl }]` for the allowlisted apps, in the order given.
  An id the key cannot see is simply absent, so the grid shows what actually
  resolved rather than a card that errors.
- **`route()` in the page script** — the hash is checked against the list before
  the element is pointed at it, so a hand-typed id falls back to the grid.

An id that is in `TEXTQL_APP_IDS` but missing from the grid means the key cannot
see that app, not that the route is wrong. Confirm with
`GET /api/textql/<id>/app`, which says so with a status.

## Trying `sharedWithMe`

`createEmbedHandler` takes a `sharedWithMe` option, which the list route passes
to `ListApps`. `TEXTQL_SHARED_WITH_ME=1` sets it here so you can see what it
does, and what it does is probably not what you want.

It **narrows**. It returns only apps authored by someone else *and* explicitly
granted to you — the default list already includes apps shared with you, so this
is always a smaller list, never a bigger one. "You" is the member who created
the API key, never the person looking at your page. And it reads explicit grants
only, so a member who reaches apps through a role — an admin — gets nothing back
from it while seeing the whole org by default.

Against this repo's key the grid comes back empty for exactly that reason. For a
list that follows your visitor, pass a function to `appIds` and answer from your
own sharing model.

## Everything else

The routes the handler serves, why the app document is re-served from your
origin, React/Svelte/Express snippets — [`EMBED.md`](../../EMBED.md). Nothing
here authorizes anyone; `createEmbedHandler` takes an `authorize` hook, which is
where a real host answers "may this caller see this app":

```ts
createEmbedHandler({ appIds, basePath, authorize: (request) => canView(request) });
```
