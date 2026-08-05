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
come from — the browser fetches the whole grid once, and the server resolves the
ids behind it.

## Run it

Credentials come from the **repo root** `.env`, shared with the other examples —
there is no per-example env file:

```sh
TEXTQL_API_KEY=...      # Settings → Developers → API Keys (must reach every app)
TEXTQL_APP_IDS=...      # the apps to list, comma-separated; falls back to TEXTQL_APP_ID
TEXTQL_SERVER_URL=...   # on-prem only; the plain host, the SDK appends /rpc/public
TEXTQL_EXCLUDE_OWN=1    # optional; hides apps your key's member authored
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
  Because the ids are known, it reads them one at a time rather than paging
  through the org. An id the key cannot see is simply absent, so the grid shows
  what resolved rather than a card that errors.
- **`route()` in the page script** — the hash is checked against the list before
  the element is pointed at it, so a hand-typed id falls back to the grid.

An id that is in `TEXTQL_APP_IDS` but missing from the grid means the key cannot
see that app, not that the route is wrong. Confirm with
`GET /api/textql/<id>/app`, which says so with a status.

## App ids in the source

`TEXTQL_APP_IDS` is read from the environment here only so you can point the
demo at your own apps without editing it. Hardcoding the ids would be equally
fine:

```ts
const APP_IDS = ['7f3c1a2e-...', 'b91d44c8-...'];
```

Data App ids are not secrets. They appear in TextQL's own URLs, they are in the
`api-base` the browser sends on every request, and knowing one grants nothing —
reading an app needs the API key, which stays on the server. The allowlist
protects the *set* of apps this handler will serve, not the ids in it.

`TEXTQL_API_KEY` is the value that must never reach the browser.

## `excludeOwn` — "shared with me"

Drops apps authored by the member your API key belongs to, leaving the ones that
reached it some other way. Wired here to `TEXTQL_EXCLUDE_OWN=1`:

```ts
createEmbedHandler({
	appIds: APP_IDS,
	basePath: `${API_BASE}/:appId`,
	excludeOwn: EXCLUDE_OWN
});
```

With `appIds`, it narrows the grid to apps you did not write. Without `appIds`
it becomes a feed of everything the key can see that it did not write, though
the cards are not clickable then — serving an app still needs an allowlist.

An empty grid with this on means every app in your allowlist is one you wrote.
That is the common case for a service-account key that created its own apps.

It compares `creator_id`, so it works no matter how access was granted — role,
grant, or admin. It is deliberately not `ListApps`' `shared_with_me`, which also
demands an explicit grant and so returns nothing for most keys. See
[`EMBED.md`](../../EMBED.md#why-not-listapps-shared_with_me) for that comparison.

## Everything else

The routes the handler serves, why the app document is re-served from your
origin, React/Svelte/Express snippets — [`EMBED.md`](../../EMBED.md). Nothing
here authorizes anyone; `createEmbedHandler` takes an `authorize` hook, which is
where a real host answers "may this caller see this app":

```ts
createEmbedHandler({ appIds, basePath, authorize: (request) => canView(request) });
```
