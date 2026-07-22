# TextQL Chat Demo

A full chat application built on the TextQL API with [`@textql/sdk`](https://www.npmjs.com/package/@textql/sdk):
create chats, pick a model and data connectors, watch runs stream in live
(thinking, tool calls, answers), preview generated assets — and reload the page
mid-run without losing the stream.

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
echo 'TEXTQL_API_KEY=your-key-here' > .env
echo 'TEXTQL_SERVER_URL=overide url if needed' > .env
```

**3. Run:**

```sh
npm run dev -- --open
```

That's it — the app opens at `http://localhost:5173`. Requires Node 18+.

> On-prem deployments: set `TEXTQL_SERVER_URL` in `.env` to your plain host
> (e.g. `https://your-host.example.com`).
> mount itself, for both unary and streaming calls.

## What it demonstrates

| Capability | How |
| --- | --- |
| Create chats with a model + connectors | `client.chats.createChat` with a typed universal paradigm |
| Send messages | `client.chats.send` |
| Live run streaming | `streaming.chats.watchChat` — cells plus `runStarted` / `runComplete` / `runError` lifecycle |
| Re-attach after a page reload | watch with `latestCompleteCellId` as the resume cursor |
| List / open / delete chats, list connectors | unary SDK calls |

## How it's put together

The API key never reaches the browser: SvelteKit server routes hold the SDK
clients and proxy everything, forwarding stream events to the client as NDJSON
lines of protojson-encoded `WatchChatEvent`s (the gRPC type is the wire
contract — no bespoke event protocol).

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

- `src/lib/server/textql.ts` — shared per-process SDK clients (unary + streaming)
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
