# Agent chat application: React 19 + FastAPI + Python SDK

A complete sibling of [`python-react-demo`](../python-react-demo), with its full
chat interface, conversation sidebar, searchable thread list, streaming answers,
tool cells, SQL tables, citations, lineage, timeline, file previews, and dark mode.
This version adds **file/CSV uploads** and **automatic agent attachment to every
new chat**.

The frontend runs **React and React DOM 19.2.0**. The backend runs **Python
3.12.10**, with dependencies installed using **pip**. All TextQL operations use
the **Python SDK, `textql-sdk==1.1.24`**, inside FastAPI.

## Architecture

```text
React application
  -> same-origin /v3/textql requests
  -> FastAPI (port 8787)
  -> TextQL Python SDK and signed upload storage
```

FastAPI implements every API endpoint directly: chat lists and history, agent
configuration and attachment, messages and streaming, file uploads, questions,
cell approvals, and preview assets. The frontend only calls those HTTP endpoints.
Credentials stay in the backend. Node is used for the React development/build
tools; there is no Node backend service.

The complete existing UI is reused as a local package, rather than copying all
its components, assets, and state utilities. Its `App` exposes an opt-in
`agentMode`; the original Python SDK example keeps its existing behavior and
React 18 version. This application has its own entrypoint, dependency lockfile,
Vite configuration, Python backend, and tests. Keep the repository checkout
intact: the UI package is a local dependency.

TextQL remains the source of truth. Reopening a chat fetches its history and
attached files from the backend. Streaming events carry complete protobuf-JSON
cell snapshots, which the frontend replaces by cell ID. No parallel chat or
upload database is maintained in React or FastAPI.

## Run the application

Prerequisites: Node 24.16.0 (matching the shared UI; see `frontend/.nvmrc`), npm, and Python 3.12.10
(see `backend/.python-version`). Install that Python version with your preferred
version manager; the application uses ordinary `venv` and pip.

### 1. Install the frontend

From the repository root:

```sh
cd examples/agent-chat-demo
# For a new setup only; keep an existing .env file.
cp -n .env.example .env
npm --prefix frontend ci
```

Edit `.env` and set:

- `TEXTQL_API_KEY`: an API key authorized to use the agent, its connectors, and
  chat/dataset operations.
- `TEXTQL_AGENT_ID`: the ID of an **existing** agent. It is attached to every
  chat created through this application. The application does not create agents
  or silently select one from the organization.

The agent's backend configuration controls the chat's model, tools, and
connectors. The composer displays the agent's model from `/v3/textql/config`
as a read-only label beside Send.
Agents without a pinned model display the organization's default model, falling
back to its system default. If settings cannot be read, the label is `Agent default`.

### 2. Start FastAPI

From `examples/agent-chat-demo`:

```sh
cd backend
python3.12 -m venv .venv
source .venv/bin/activate
python --version
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8787 --reload
```

The version command should print `Python 3.12.10`. FastAPI loads `.env` and initializes the Python SDK clients. Missing credentials
stop startup. The backend uses the SDK's generated Connect clients to preserve
complete protobuf payloads, including streaming chat events.

`requirements.txt` contains the runtime packages: FastAPI, Uvicorn (the web
server), HTTPX (HTTP requests), python-dotenv (`.env` loading), the TextQL SDK,
python-multipart (file uploads), and truststore (system TLS certificates).
Backend tests use Python's built-in `unittest`.

### 3. Start React

In another terminal, from `examples/agent-chat-demo`:

```sh
cd frontend
nvm use
npm run dev
```

Open **<http://localhost:5173>**. The full interface loads from React; Vite proxies
all `/v3` requests through FastAPI. `/health` on port 8787 reports Python SDK initialization. It does not probe the upstream API. FastAPI's route documentation is at **<http://localhost:8787/docs>**.

## Agent and upload behavior

1. Select files with **+** or drag them into the composer. Nonempty files with
   filename extensions are supported, up to **20 MiB each**. The backend registers
   each upload, transfers its bytes to signed storage, and finalizes it. The file
   appears as **Uploaded** in the composer. Uploading does not create a chat or
   send a message.
2. Type your message and press **Send**. For a new chat, the backend creates it
   and attaches the configured agent first. The app then calls `AttachDataset`
   for each uploaded file and waits for its preparation to finish before sending
   your message. The composer displays **Preparing files for your message…**
   during this wait. CSV parsing and sandbox startup can still take time here.
3. Confirmed attachments move into the conversation. If preparation fails, the
   message and remaining files stay in the composer; no message is sent. Files
   already attached remain attached, so retrying prepares only the remaining
   files. A repeated attachment request first checks chat history to recover a
   previously completed attachment.
4. Uploaded but unsent files are a local draft: refreshing or leaving the chat
   discards that draft. Confirmed chat attachments reload from TextQL history.
   The remove button removes a pending file from the draft, not from storage.
5. Agent attachment failure prevents sending and triggers cleanup of the empty
   chat. Existing chats belonging to another agent reject attachment and sending.

The frontend uses `POST /v3/textql/files` to upload and
`POST /v3/textql/chats/{chat_id}/files/attach` to prepare a file at Send time.
The `/send` request follows only after every selected file is ready.

## Configuration

| Variable | Default / purpose |
| --- | --- |
| `TEXTQL_API_KEY` | Required, server-only TextQL credential. |
| `TEXTQL_AGENT_ID` | Required, server-only agent selection. |
| `TEXTQL_SERVER_URL` | `https://app.textql.com/rpc/public` in `.env.example`; use your deployment's public RPC base. |
| `BACKEND_URL` | `http://127.0.0.1:8787`; Vite's backend proxy target, including `vite preview`. |
| `VITE_USERCONTENT_HOST` | `textqlusercontent.com`; allowed chart/file-preview host. |
| `VITE_APP_HOST` | `app.textql.com`; allowed sandbox-preview host. |

Only `VITE_` variables are public. Preview hosts must be set consistently with
your TextQL deployment. Keep the API key and agent selection in the backend `.env`.

This is a **local, single-credential example**, not a multi-user authentication
system. Do not expose it publicly with a privileged API key. A production
deployment needs authenticated users, per-user credentials/authorization, abuse
limits, and a reverse proxy serving the built frontend with `/v3` routed to
FastAPI. `frontend/dist` is the production frontend build; FastAPI is the required backend process.

### Upload timing

Upload success waits only for storage transfer and upload finalization.
Attachment preparation is a separate request when the user presses Send.
FastAPI logs stage durations and includes them in `Server-Timing` response headers.

## Checks

```sh
cd examples/agent-chat-demo
cd backend
.venv/bin/python -m unittest discover -s tests -v
cd ../frontend
npm run build
npx playwright install chromium
npm test
```

Browser tests run the complete React application against an explicitly labeled
test API fixture, without credentials or live model calls. Python backend tests exercise SDK boundaries, HTTP contracts, uploads, and SSE
streams. A local transport test verifies requests from the real Python SDK
without using live credentials. These checks do not substitute for
a live run with your API key and agent.

When editing shared UI source in `../python-react-demo/frontend/src`, reinstall
the local package before running this application's checks, because
`install-links=true` installs a package copy:

```sh
cd examples/agent-chat-demo/frontend
rm -rf node_modules/python-react-demo-frontend
npm install
```

Restart Vite after refreshing that package; development dependencies under
`node_modules` are not watched for shared source edits.

## Layout

```text
agent-chat-demo/
  .env.example
  backend/
    .python-version          Python 3.12.10
    requirements.txt         pip dependencies
    app/main.py              FastAPI lifecycle and Python SDK setup
    app/textql_router.py     browser API routes and streaming
    app/files.py             dataset uploads and attachment history
    tests/test_backend.py    HTTP, streaming, upload, and SDK transport checks
  frontend/
    src/main.tsx             full shared App, with agent mode enabled
    src/app.css              shared theme and component styles
    vite.config.ts           asset reuse and same-origin API proxy
    tests/                   full-application browser tests and test API fixture
```
