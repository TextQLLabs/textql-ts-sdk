# CSV agent: React 19 + FastAPI + Python SDK

A narrow sibling of [`agent-chat-demo`](../agent-chat-demo). The user uploads one file
(`.csv`, `.tsv`, `.xlsx`, `.xls`, `.xlsm`, `.ods`, or `.parquet`, as the TextQL app accepts).
The agent parses and cleans it, saves the tables it derives as new CSVs, and draws three
charts. Every CSV, the input and each output, opens in a spreadsheet viewer with sorting,
per-column filters, search, column resizing and hiding, cell inspection, and download of
the filtered view.

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
| `GET /v3/csv/runs/{id}` | A run's file name, instructions, input dataset, and cells |
| `POST /v3/csv/runs` | Create the agent chat, attach the upload, send the prompt, and stream the run as SSE |
| `POST /v3/csv/uploads` | Register an upload and return its signed storage URL |
| `POST /v3/csv/uploads/{id}/complete` | Finalize the upload once the browser has PUT the bytes |
| `GET /v3/csv/datasets/{id}/file` | A signed URL for an upload's original bytes (`ExportDataset`), for CSV/TSV input |
| `GET /v3/csv/datasets/{id}/values` | An upload's rows parsed by TextQL (`GetDatasetValues`), for spreadsheet input |

Uploads follow the TextQL app's pattern: `CreateUploadPresignUrl`, a PUT from the browser
straight to the signed URL, then `ProcessUploadPresignUrl`. The file never passes through
FastAPI, so the server sets no size limit; the UI caps uploads at 100 MB (`frontend/src/lib/files.ts`).
TextQL copies a table into the agent's sandbox up to 500 MB.

The grid loads at most the first 200,000 rows; the agent still works on the whole file. CSV/TSV
input streams from its own bytes. Spreadsheet input is read with `GetDatasetValues`, as the app
previews attachments; its DataFrame cannot mark a missing number, so empty numeric cells in
Excel/ODS/Parquet input currently show filled values.

## Run it

```sh
cd examples/csv-agent-demo
cp -n .env.example .env   # set TEXTQL_API_KEY and TEXTQL_AGENT_ID

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

`.env` holds the only three settings:

| Variable | Purpose |
| --- | --- |
| `TEXTQL_API_KEY` | Server-only TextQL credential |
| `TEXTQL_SERVER_URL` | Your deployment, e.g. `https://app.textql.com` |
| `TEXTQL_AGENT_ID` | The agent attached to every run; its instructions must accept CSV input |

The backend reads only this file, not `agent-chat-demo/.env`. The analysis prompt lives in
`backend/csv_agent/runs.py`.
