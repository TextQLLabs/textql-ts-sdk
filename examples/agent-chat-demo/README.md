# Agent chat application: React 19 + FastAPI + TypeScript SDK

A complete sibling of [`python-react-demo`](../python-react-demo), with its full
chat interface, conversation sidebar, searchable thread list, streaming answers,
tool cells, SQL tables, citations, lineage, timeline, file previews, and dark mode.
This version adds **file/CSV uploads** and **automatic agent attachment to every
new chat**.

The frontend runs **React and React DOM 19.2.0**. The backend runs **Python
3.12.10**, with dependencies installed using **pip**. All TextQL operations use
the **TypeScript SDK**, not the Python SDK.

## Architecture

```text
React application
  -> same-origin /v3/textql requests
  -> FastAPI (port 8787)
  -> private Node TypeScript SDK service (loopback port 8788)
  -> TextQL and its signed upload storage
```

FastAPI starts and stops the Node child process automatically, so development
needs only two terminals: backend and frontend. A generated, per-process token
protects the private service. Neither that token nor the TextQL API key reaches
the browser. Node is necessary because Python cannot execute the TypeScript SDK.

The complete existing UI is reused as a local package, rather than copying all
its components, assets, and state utilities. Its `App` exposes an opt-in
`agentMode`; the original Python SDK example keeps its existing behavior and
React 18 version. This application has its own entrypoint, dependency lockfile,
Vite configuration, backend, SDK service, and tests. Keep the repository checkout
intact: both the UI package and SDK are local dependencies.

TextQL remains the source of truth. Reopening a chat fetches its history and
attached files from the backend. Streaming events carry complete protobuf-JSON
cell snapshots, which the frontend replaces by cell ID. No parallel chat or
upload database is maintained in React, FastAPI, or Node.

## Run the application

Prerequisites: Node 24.16.0 (matching the shared UI; see `frontend/.nvmrc`), npm, and Python 3.12.10
(see `backend/.python-version`). Install that Python version with your preferred
version manager; the application uses ordinary `venv` and pip.

### 1. Build the local TypeScript SDK and install the application

From the repository root:

```sh
npm ci
npm run build
cd examples/agent-chat-demo
cp .env.example .env
npm --prefix sdk-service ci
npm --prefix frontend ci
```

Edit `.env` and set:

- `TEXTQL_API_KEY`: an API key authorized to use the agent, its connectors, and
  chat/dataset operations.
- `TEXTQL_AGENT_ID`: the ID of an **existing** agent. It is attached to every
  chat created through this application. The application does not create agents
  or silently select one from the organization.

The agent's backend configuration controls the chat's model, tools, and
connectors. The UI does not offer conflicting model/connector overrides.

### 2. Start FastAPI

From `examples/agent-chat-demo`:

```sh
cd backend
python3.12 -m venv .venv
.venv/bin/python --version
.venv/bin/python -m pip install -r requirements.txt
.venv/bin/python -m uvicorn app.main:app --host 127.0.0.1 --port 8787 --reload
```

The version command should print `Python 3.12.10`. FastAPI loads `.env`, starts
the private SDK service, checks its health, and then accepts requests. Missing
credentials or a failed child process stop startup instead of silently serving
a broken application.

### 3. Start React

In another terminal, from `examples/agent-chat-demo`:

```sh
cd frontend
nvm use
npm run dev
```

Open **http://localhost:5173**. The full interface loads from React; Vite proxies
all `/v3` requests through FastAPI. `/health` on port 8787 checks the child
service. FastAPI's route documentation is at **http://localhost:8787/docs**.

## Agent and upload behavior

1. Start a new chat by sending a message or selecting **Attach files or CSVs**.
   The backend creates an empty chat, calls `AttachAgentToChat`, and checks the
   returned chat's agent before returning its ID. Attachment runs before any
   file cells or messages, because TextQL rejects attaching an agent after a
   chat already has messages.
2. If agent attachment fails, the backend tries to delete the empty partial
   chat and returns an error. If cleanup also fails, the error explicitly asks
   you to inspect the TextQL chat list. No message is sent on either path.
3. Select one or more nonempty files with filename extensions, up to **20 MiB each**. Files upload
   sequentially; the send button stays disabled until the uploads finish.
   CSVs use tabular datasets; text, images, spreadsheets, and documents use
   TextQL's corresponding dataset types. Actual format support is determined
   by the TextQL deployment.
4. For each file, the SDK registers a dataset upload, the service PUTs its bytes
   to signed storage, the SDK finalizes the upload, and `AttachDataset` associates
   it with the chat. The UI only labels a file **attached** after that final call
   succeeds. Backend upload/processing errors are shown inline.
5. Reopening or refreshing the chat reloads attachments from durable backend
   cells. Successful files remain attached if a later file in a selection fails.
   An interrupted request may have completed server-side: refresh files before
   retrying to avoid duplicates.

Existing chats remain browsable. Sending or uploading into a chat owned by a
different agent, or with no agent, returns an explicit error instead of changing
that chat's configuration. Create a new chat to use the configured agent.

## Configuration

| Variable | Default / purpose |
| --- | --- |
| `TEXTQL_API_KEY` | Required, server-only TextQL credential. |
| `TEXTQL_AGENT_ID` | Required, server-only agent selection. |
| `TEXTQL_SERVER_URL` | `https://app.textql.com/rpc/public` in `.env.example`; use your deployment's public RPC base. |
| `SDK_SERVICE_PORT` | `8788`; always bound to loopback. |
| `BACKEND_URL` | `http://127.0.0.1:8787`; Vite's backend proxy target, including `vite preview`. |
| `VITE_USERCONTENT_HOST` | `textqlusercontent.com`; allowed chart/file-preview host. |
| `VITE_APP_HOST` | `app.textql.com`; allowed sandbox-preview host. |

Only `VITE_` variables are public. Preview hosts must be set consistently with
your TextQL deployment. The private SDK token is generated by FastAPI; do not
put it in frontend configuration.

This is a **local, single-credential example**, not a multi-user authentication
system. Do not expose it publicly with a privileged API key. A production
deployment needs authenticated users, per-user credentials/authorization, abuse
limits, and a reverse proxy serving the built frontend with `/v3` routed to
FastAPI. Keep the Node service private. `frontend/dist` is the production build;
the Node SDK service remains a required backend process.

## Checks

```sh
cd examples/agent-chat-demo
npm --prefix sdk-service run check
npm --prefix sdk-service test
cd backend
.venv/bin/python -m unittest discover -s tests -v
cd ../frontend
npm run build
npx playwright install chromium
npm test
```

Browser tests run the complete React application against an explicitly labeled
test API fixture, without credentials or live model calls. SDK-service tests
exercise SDK boundaries and HTTP contracts. These checks do not substitute for
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
    app/main.py              FastAPI proxy and child-process lifecycle
    tests/test_proxy.py      upload, streaming, and credential-boundary checks
  frontend/
    src/main.tsx             full shared App, with agent mode enabled
    src/app.css              shared theme and component styles
    vite.config.ts           asset reuse and same-origin API proxy
    tests/                   full-application browser tests and test API fixture
  sdk-service/
    src/                     TypeScript SDK API routes, streaming, uploads
    test/                    SDK-service tests
```
