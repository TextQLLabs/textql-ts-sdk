# Forecast agent: React 19 + FastAPI + Python SDK

A narrow sibling of [`agent-chat-demo`](../agent-chat-demo). The workspace opens a CSV, TSV, or Excel/ODS
file from your machine (`DATA_FILE_PATH` in `.env`) in a spreadsheet viewer with sorting, per-column
filters, search, and download of the filtered view.

**Edit parameters** sets the forecast: type (revenue or expenses), fiscal years, scenario, the
actual and forecast periods, and which transactions to include. Applying them narrows the grid
to the selected rows at once and asks the agent for a forecast. The first forecast uploads the
file and opens a chat; each later one is a follow-up turn in that chat, so the agent compares it
with the last. The forecast CSV and chart appear as output tabs. The parameter-to-column mapping
is `COLUMNS` in `frontend/src/lib/forecast.ts`.

## Architecture

```text
React (Vite, :5175)
  -> /v3 proxy
  -> FastAPI (:8789) = agent-chat-demo's app + /v3/csv routes
  -> TextQL Python SDK
```

The backend imports `agent-chat-demo/backend`'s FastAPI app (SDK setup, uploads, history,
streaming, preview proxy) and adds `csv_agent/runs.py`:

| Route | Purpose |
| --- | --- |
| `GET /v3/csv/runs` | The API key's CSV runs with the agent, recognised by the analysis prompt |
| `GET /v3/csv/runs/{id}` | A session's file name, each forecast's parameters, and its cells |
| `POST /v3/csv/runs` | Create the agent chat, attach the upload, send the first forecast prompt, and stream it |
| `POST /v3/csv/runs/{id}/messages` | Re-forecast in the same chat with new parameters, streaming only the new turn |
| `POST /v3/csv/uploads` | Register an upload and return its signed storage URL |
| `POST /v3/csv/uploads/{id}/complete` | Finalize the upload once the browser has PUT the bytes |

Uploads follow the TextQL app's pattern: `CreateUploadPresignUrl`, a PUT from the browser
straight to the signed URL, then `ProcessUploadPresignUrl`. The file never passes through
FastAPI, so the server sets no size limit; the UI caps uploads at 100 MB (`frontend/src/lib/files.ts`).
TextQL copies a table into the agent's sandbox up to 500 MB.

The grid loads at most the first 200,000 rows; the agent works on the whole file.

## Run it

```sh
cd examples/csv-agent-demo
cp -n .env.example .env   # set TEXTQL_API_KEY, TEXTQL_AGENT_ID, and DATA_FILE_PATH

cd backend
uv venv --python 3.12.10 .venv
uv pip install --python .venv/bin/python -r requirements.txt
.venv/bin/python -m uvicorn csv_agent.main:app --host 127.0.0.1 --port 8789 --reload

# another terminal
cd ../frontend
npm install
npm run dev               # http://localhost:5175
```

## Configuration

`.env` holds four settings:

| Variable | Purpose |
| --- | --- |
| `TEXTQL_API_KEY` | Server-only TextQL credential |
| `TEXTQL_SERVER_URL` | Your deployment, e.g. `https://app.textql.com` |
| `TEXTQL_AGENT_ID` | The agent attached to every run; its instructions must accept the file's format |
| `DATA_FILE_PATH` | The local file the workspace opens, e.g. `~/Downloads/financial_transactions_1mb.xlsx`. The Vite dev server reads it from disk; it never reaches the backend or the browser's env |

The backend reads only this file, not `agent-chat-demo/.env`. The forecast prompt lives in
`backend/csv_agent/runs.py`.
