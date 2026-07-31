# Embed a Data App

A runnable version of [`EMBED.md`](../../EMBED.md) — the whole embed is two
imports from `@textql/sdk`.

The whole example is one file. Server half:

```ts
const embed = toNodeHandler(createEmbedHandler());
```

Browser half, in the `PAGE` string:

```html
<script type="module" src="/element.js"></script>
<textql-app></textql-app>
```

Everything else in `server.ts` exists because the example runs under bare
`node`: a route to hand the browser the element, and a route to serve the page
holding it. Your app already has both.

## Run it

```sh
cd examples/embed-app
npm install
cp .env.example .env   # then fill in the key and the app id
npm run dev
```

Open `http://localhost:4180`.

```sh
TEXTQL_API_KEY=...      # Settings → Developers → API Keys (admin only)
TEXTQL_APP_ID=...       # from the app's URL in TextQL: /app/<id>
TEXTQL_SERVER_URL=...   # on-prem only; the plain host, the SDK appends /rpc/public
```

Point `TEXTQL_APP_ID` at an app that declares compute functions. An app without
them renders exactly the same but never calls back to your server, so the
`/compute` route — and the whole bridge — sits unused.

## What to look at

`server.ts` is the whole thing: mounting the handler, serving the element
without a bundler, and the `PAGE` string where `<textql-app>` sits with
`app-meta` / `app-ready` / `app-error` driving the header.

The header names the app's compute functions and says when the bridge connects.
Those are the two halves worth seeing: the document renders off `/document`,
and anything the app computes round-trips through `POST /compute`, which
refuses any name the app does not declare.

```sh
curl -X POST localhost:4180/api/textql/compute \
  -H 'content-type: application/json' \
  -d '{"name":"<a name from the header>","params":{}}'
```

The routes the handler serves, the `authorize` hook to add before you ship, why
the app document is re-served from your origin, and snippets for
React/Svelte/Express are all in [`EMBED.md`](../../EMBED.md).

With a bundler, the `/element.js` route and the `PAGE` string both go away —
the browser half is just `import '@textql/sdk/embed/element'`.
