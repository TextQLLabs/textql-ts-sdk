# TextQL Chat Demo

A full chat application built on the TextQL API with [`@textql/sdk`](https://www.npmjs.com/package/@textql/sdk):
create chats, pick a model and data connectors, watch runs stream in live
(thinking, tool calls, answers), preview generated assets — and reload the page
mid-run without losing the stream.

Here's a demo of the chat. 
https://screen.studio/share/i4hUljQU

Built with SvelteKit. It doubles as the reference implementation for the SDK's
[streaming client](../../STREAMING.md).

## Setup

**1. Get a TextQL API key** — in the TextQL app under
**Settings → Developers → API Keys**, click **+ Create API Key** (admin only).

**2. Install and configure:**

```sh
git clone https://github.com/TextQLLabs/textql-ts-sdk.git
cd textql-ts-sdk/examples/chat-demo
npm install
# Encrypts the API key held in each visitor's session cookie. Any 32+ random chars.
echo "SESSION_SECRET=$(openssl rand -base64 32)" > .env
```

**3. Run:**

```sh
npm run dev -- --open
```

The app opens at `http://localhost:5173` and asks for your API key. Requires
Node 22.12+.

> On-prem deployments: paste your host (e.g. `https://textql.your-company.com`)
> into the **Using an on-prem deployment?** field on the sign-in screen. It is
> stored with the key and used as the SDK's `serverURL` for both unary and
> streaming calls.

## Sign-in

There is no user database. Each visitor pastes their own TextQL API key; the key
is verified against the API, then sealed with AES-GCM under `SESSION_SECRET` and
returned as an httpOnly cookie. Requests decrypt it, build per-request SDK
clients (`src/hooks.server.ts`), and hand them to the route via `event.locals`.

So the key lives in exactly two places: the visitor's browser, opaque to it, and
the memory of the request using it. Nothing is persisted server-side, and
rotating `SESSION_SECRET` signs everyone out.

TextQL has no OAuth provider for third-party apps — an API key is the only
credential the public API accepts, so it is the only one this demo asks for.

## Deploying

`npm run build` uses `adapter-auto`, so Vercel, Netlify, Cloudflare Pages and
friends are detected the usual way. Wherever you deploy it, `SESSION_SECRET` is
the only secret to set — there is deliberately no `TEXTQL_API_KEY`, since every
visitor brings their own key and the deployment holds no TextQL credentials.

One thing to size for: live run streaming holds a response open for the length
of a run, so a host that caps request duration will cut long runs short.

## What it demonstrates

| Capability | How |
| --- | --- |
| Create chats with a model + connectors | `client.chats.createChat` with a typed universal paradigm |
| Send messages | `client.chats.send` |
| Live run streaming | `streaming.chats.watchChat` — cells plus `runStarted` / `runComplete` / `runError` lifecycle |
| Re-attach after a page reload | watch with `latestCompleteCellId` as the resume cursor |
| List / open / delete chats, list connectors | unary SDK calls |

## How it's put together

The API key is never usable by the browser: it rides along as an encrypted
cookie, and only SvelteKit server routes hold the SDK clients. They proxy
everything, forwarding stream events to the client as NDJSON lines of
protojson-encoded `WatchChatEvent`s (the gRPC type is the wire contract — no
bespoke event protocol).

```md
Browser (ChatPage.svelte)
  │  fetch + NDJSON
  ▼
SvelteKit server routes (src/routes/api/**)
  │  @textql/sdk (unary) + @textql/sdk/streaming (Connect-RPC)
  ▼
TextQL API
```

Key files:

- `src/hooks.server.ts` — the auth gate; builds per-request SDK clients from the session
- `src/lib/server/session.ts` — sealing/unsealing the visitor's API key into a cookie
- `src/lib/server/textql.ts` — pulls this request's SDK clients off `event.locals`
- `src/routes/api/chat/+server.ts` — create/send, then stream the run via `watchChat`
- `src/routes/api/chats/[id]/watch/+server.ts` — re-attach to a live run after reload
- `src/lib/streamEvents.ts` — the typed NDJSON wire contract (protojson `WatchChatEvent` + zod envelope)
- `src/lib/components/ChatPage.svelte` — stream consumption, run-state UI, resume
- `src/lib/cells.ts` — cell lifecycle helpers (what's running vs settled)

## Scripts

```sh
npm run dev      # dev server with hot reload
npm run check    # svelte-check (types)
npm run build    # production build
npm run preview  # serve the production build
```
