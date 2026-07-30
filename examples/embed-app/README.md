# Embed a Data App

The smallest thing that renders a TextQL Data App inside an application you
already have. You configure three values — an API key, an app id, a server URL
— and get one element. Two files:

| File | Runs where | Does |
| --- | --- | --- |
| `server.ts` | your backend | two endpoints — hand out the signed document URL, run compute functions |
| `public/embed.js` | the browser | a `<textql-app>` custom element — iframe plus the `ana/v1` bridge |

No framework, no build step, no dependencies in the browser.

## Try it

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

## Use it in your app

**1. Serve the two endpoints.** Copy the `loadApp` and `runComputeFunction`
handlers out of `server.ts` into whatever you already run — Express, a Next
route handler, Hono, a Lambda. They need `@textql/sdk` and the three settings
above, nothing else. The paths are the contract:

```
GET  /textql/app           → { name, url, screenshotUrl, functions }
POST /textql/app/compute   → { result }
```

**2. Drop in the element.**

```html
<script type="module" src="/embed.js"></script>
<textql-app api-base="/textql" style="height: 600px"></textql-app>
```

It's a custom element, so every framework already supports it:

```jsx
// React 19+
import '/embed.js';

<textql-app api-base="/textql" style={{ height: 600 }} />;
```

```svelte
<script>import '/embed.js';</script>
<textql-app api-base="/textql" style="height: 600px" />
```

Size it generously. Like an iframe it has no intrinsic size, and Data Apps lay
out against the full viewport — the same `absolute inset-0` region they get
inside TextQL. Drop one into a 900px content column and it's the app's own
layout that breaks, not the element: you'll see its canvas clipped on both
sides. Full-bleed width and a real height are the safe defaults.

Two events fire on the element: `app-ready` (detail is the app metadata) and
`app-error` (detail is a runtime error the app reported).

To embed a second app, run a second pair of endpoints under a different
`api-base`. Nothing about which app is rendered is client-controlled, which is
the point: the browser cannot ask for a different one.

## Before you ship this

The API key is org-wide, so **your two endpoints are the access control**. The
app id being pinned server-side covers the worst case already. Two things this
example can't decide for you:

- **Check your own session** at the top of both handlers. Nothing here knows who
  the caller is, so as written the app is visible to anyone who can reach the
  endpoint.
- **Rate-limit compute.** `runComputeFunction` refuses names the app doesn't
  declare, but a caller can still hammer the ones it does. TextQL rate-limits
  server-side and returns `resource_exhausted`; a production host should retry
  that with backoff instead of surfacing it (see `RATE_LIMIT_BACKOFFS_MS` in the
  main app's `computeBridge.ts`).

Serving `embed.js` and the endpoints from the same origin as your page keeps
this same-origin. If you host them separately you'll need CORS and credentialed
fetches, and the CSRF story becomes yours to solve.

## How it works

```
your page                  your server                  TextQL
──────────                 ───────────                  ──────
<textql-app>
  │  GET /textql/app ──────────►  apps.get ──────────────► signed htmlUrl
  ▼
<iframe sandbox="allow-scripts" src={htmlUrl}>
  │  postMessage ready ──►  hello (capabilities, functions)
  │  postMessage compute.run ──►
  │      POST /textql/app/compute ─►  apps.invokeComputeFunction
  │  ◄── compute.result
```

The document is untrusted third-party HTML, so the iframe gets `allow-scripts`
and nothing else. That produces an opaque origin, which is why the element
identifies inbound messages by `event.source` rather than by origin.

`htmlUrl` is signed and expires. There is nothing to refresh — retry means
calling `GET /textql/app` again, which is what the element's Retry button does.

### What this deliberately leaves out

The full bridge in the TextQL app also carries per-member state, activity
logging, presence, deep-link routing, realtime sockets, and asking the agent.
This host declares all of them `false` in its `hello`, which is a supported
configuration. Apps that only render data and call compute functions work
unchanged; apps built around member state render but lose those features.

Declaring a capability off is only half of it. `state.*` and `activity.*` are
request/response calls, so the runtime blocks on a reply keyed to the message
id — a host that stays silent leaves that part of the app spinning forever.
The element answers them with `<kind>.error`, which is what the main app's
`computeBridge.ts` does for anonymous and share-link viewers. The
fire-and-forget messages (`presence.*`, `realtime.*`, `activity.subscribe`,
`route.changed`) are safe to ignore, and are ignored.
