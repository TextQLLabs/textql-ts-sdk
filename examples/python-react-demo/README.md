# TextQL Chat Demo (Python backend + React)

A streaming chat app split across two processes: a **FastAPI backend** that talks
to TextQL with the [Python SDK](https://pypi.org/project/textql-sdk/), and a
**React frontend** that renders the run as it arrives — thinking, tool calls,
SQL and its results, the answer typing itself out.

It is the same UI as [`../react-demo`](../react-demo) (same tokens, same cell
components), wired to Python instead of the TypeScript SDK.

## How it streams

The backend does not interpret cells. `watch_chat` gives it a `WatchChatEvent`
protobuf; it re-encodes that as protobuf JSON and writes it to an SSE frame:

```python
return {"type": event.WhichOneof("payload") or "unknown", **MessageToDict(event)}
```

That is deliberately the same arrangement the real TextQL app uses — its Go
backend `protojson.Marshal`s the event and the Svelte frontend switches on the
oneof case. A `Cell` is a oneof over ~60 payload types and which of them are
worth drawing is a UI decision, so the whole snapshot goes to the browser and
`src/lib/cells.ts` decides. A cell type this demo has never heard of still
arrives intact and falls through to a generic tool row.

Two consequences worth knowing before reading the frontend:

- **Every cell event is a full snapshot, not a delta.** Key by `cell.id` and
  replace. Prose (`mdCell` / `ansCell`) arrives with `content` a few tokens
  longer each time and `complete` unset the whole way — that *is* the typing
  effect. Waiting for `complete` turns a message that took six seconds to write
  into one block at the end.
- **`complete` is the terminal signal, not `lifecycle`.** It's polymorphic
  server-side: a markdown cell is complete on creation, a SQL cell only once
  executed. `execError` is per cell and is *not* covered by the stream's
  `runError` event.

Each turn posts to `/v3/textql/chats/{id}/send`, which sends the message and
then holds the SSE stream open until `runComplete`. The next turn passes the
previous one's `finalCellId` as `latest_cell_id`, so the server replays from
there instead of from the top of the chat.

## Setup

**1. Get a TextQL API key** — in the TextQL app under **Settings → Developers →
API Keys**, click **+ Create API Key** (admin only).

**2. Backend** (Python 3.11 — see `backend/.python-version`):

```sh
cd backend
python3.11 -m venv .venv
.venv/bin/pip install -r requirements.txt
cp .env.example .env      # then put your key in it
.venv/bin/uvicorn app.main:app --port 8787 --reload
```

**3. Frontend** (Node 24.16.0 — see `frontend/.nvmrc`; `engines` is pinned exactly and
`.npmrc` sets `engine-strict=true`, so `npm install` refuses any other version), in a
second terminal:

```sh
cd frontend
nvm use          # 24.16.0
npm install
npm run dev
```

Open http://localhost:5173. Vite proxies `/v3` to the backend, so the browser
never sees the API key and there is no CORS in the way. Point it elsewhere with
`BACKEND_URL=http://host:port npm run dev`.

## Self-hosted / VPC deployments

Five things assume TextQL's SaaS hosts. Three are environment variables; two are
hardcoded constants you have to edit.

The browser is not one of them — `src/lib/api.ts` calls `/v3/textql/...`
relative and same-origin, which is also why the API key never leaves the Python
process.

### Environment

| Set where | Variable | Why |
| --- | --- | --- |
| `backend/.env` | `TEXTQL_SERVER_URL=https://textql.internal.example.com` | The host the SDK calls (`main.py:47`). Give it the plain host — the SDK appends the `/rpc/public` mount itself, for both unary and streaming calls. |
| `backend/.env` | `ALLOWED_ORIGINS=https://demo.internal.example.com` | CORS (`main.py:36`). Defaults to `http://localhost:5173,http://127.0.0.1:5173`, which is only right while you are on the Vite dev server. |
| frontend shell | `BACKEND_URL=http://backend-host:8787 npm run dev` | Where Vite proxies `/v3` (`vite.config.ts:17`). Defaults to `http://127.0.0.1:8787`. Dev only — a built frontend is served same-origin and does not proxy. |

### Hardcoded — needs a code edit

Preview assets (charts, images, sandbox embeds) are fetched through the backend's
`/v3/textql/preview-proxy` route, because those origins refuse to be framed from
anywhere but the main TextQL app. Both ends of that proxy carry their own copy of
the allowed hosts, and both have to agree:

- **`backend/app/textql_router.py:794-795`** — `_USERCONTENT_HOST` / `_APP_HOST`,
  gating `_is_allowed_preview_host` (`:816`). Miss this and every asset 403s at
  your own backend.
- **`frontend/src/lib/previewUrl.ts:11-12`** — the same two constants, deciding
  which URLs get rewritten to the proxy. Miss this and the URL passes through
  untouched, so the iframe hits the asset host directly and fails to frame.

Check what your deployment actually serves assets from rather than assuming it
matches `TEXTQL_SERVER_URL`: even on SaaS these are two different hosts — the API
is `app.textql.com`, assets are `textqlusercontent.com`.

## Layout

```
backend/
  app/main.py           FastAPI app; the lifespan builds the SDK clients once
  app/textql_router.py  every route, under /v3/textql
frontend/
  src/lib/api.ts        the nine calls the UI makes, plus the SSE reader
  src/lib/cells.ts      the oneof switch: which payload, what to call it
  src/lib/cellBlocks.ts groups a run's cells into tool batches
  src/components/       ChatPage, Composer, ToolSequence, CellDetail, …
```

## Routes

| Route | What it does |
| --- | --- |
| `GET /v3/textql/chats` | List chats, newest first (`q`/`search_term`, and either `page`/`page_size` or `limit`/`offset`) |
| `POST /v3/textql/chats` | Create a chat; returns the `chat_id` every other call needs |
| `GET /v3/textql/chats/{id}/history` | Replay cells, oldest-first, in the same JSON the stream sends |
| `POST /v3/textql/chats/{id}/send` | Send a turn; SSE by default, `stream: false` for the run's cells as JSON |
| `GET /v3/textql/chats/{id}/watch` | The whole chat's event stream, across turns; never closes on `runComplete` |
| `POST /v3/textql/questions` | Answer or skip a questions cell, resuming a paused run |
| `GET /v3/textql/connectors` | Connectors, for the composer's picker |
| `DELETE /v3/textql/chats/{id}` | Client-side close; the chat stays and can be resumed |

Interactive docs at http://localhost:8787/docs.

Two of these don't take the obvious SDK path, both for the same reason — the
generated REST models are stricter than the data:

- `/connectors` goes through `create_connect_client(ConnectorServiceClient)`,
  the SDK's documented escape hatch, because `connectors.get_connectors` makes
  the per-warehouse `*Metadata` a required union and one connector with none set
  fails the whole page.
- `/chats/{id}/history` dumps each cell by its wire aliases rather than
  flattening it, so replay and live streaming render through one path.

## Steering

`send` takes `steering: true`, which delivers the message *into* a running turn
("stop, actually do X") instead of queueing another one. The UI doesn't expose
it; `curl` does:

```sh
curl -N -X POST localhost:8787/v3/textql/chats/$CHAT/send \
  -H 'content-type: application/json' \
  -d '{"message":"actually, group by month","steering":true}'
```
