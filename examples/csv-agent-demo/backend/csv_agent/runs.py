"""Routes the CSV workspace needs beyond the agent-chat-demo API."""

from collections.abc import AsyncGenerator
from datetime import time as datetime_time
from datetime import timezone

from urllib.parse import parse_qs, urlsplit

from app import textql_router
from app.files import attach_uploaded_file, classify_file, file_from_cell
from fastapi import APIRouter, HTTPException, Query, Request
from fastapi.responses import StreamingResponse
from google.protobuf.json_format import MessageToDict
from pydantic import BaseModel, Field
from textql_sdk._connect.public import chat_pb2, dataset_pb2
from textql_sdk._connect.public.chat_pb2 import (
    ChatSortDirection,
    ChatSortField,
    GetChatsRequest,
)

router = APIRouter(prefix="/v3/csv", tags=["CSV agent"])

# Runs are recognised by their prompt after the fetch, so over-read.
_SCAN_LIMIT = 100

_PROMPT_HEAD = 'The attached file "'
_PROMPT_BODY = """" is a data file to analyze.
1. Parse and profile it: column types, missing values, duplicates, and data-quality issues.
2. Clean it and save the cleaned table as a CSV file. Save any useful derived tables (aggregations, breakdowns, summaries) as CSV files too, each with a descriptive file name.
3. Create exactly three charts that best explain the data.
4. Finish with a short summary of what you found and what each output file contains."""
_INSTRUCTION_MARKER = "\n\nAdditional instructions: "


def build_prompt(file_name: str, instruction: str) -> str:
    prompt = _PROMPT_HEAD + file_name.replace('"', "'") + _PROMPT_BODY
    if instruction.strip():
        prompt += _INSTRUCTION_MARKER + instruction.strip()
    return prompt


def parse_prompt(text: str) -> tuple[str, str] | None:
    """(file name, instruction) from a run's prompt, or None for any other chat."""
    if not text.startswith(_PROMPT_HEAD):
        return None
    file_name = text[len(_PROMPT_HEAD) :].split('"', 1)[0]
    _, _, instruction = text.partition(_INSTRUCTION_MARKER)
    return (file_name, instruction.strip()) if file_name else None


@router.get("/runs")
async def list_runs(limit: int = Query(30, ge=1, le=100)):
    """The API key's own CSV runs, newest first."""
    resp = await textql_router._get_streaming().chats.get_chats(
        GetChatsRequest(
            member_only=True,
            limit=_SCAN_LIMIT,
            sort_by=ChatSortField.CHAT_SORT_FIELD_UPDATED_AT,
            sort_direction=ChatSortDirection.CHAT_SORT_DIRECTION_DESC,
            exclude_batch_runs=True,
        )
    )
    agent_id = textql_router._agent_id()
    runs = []
    for chat in resp.chats:
        parsed = parse_prompt((chat.preview or "").strip())
        if not parsed or chat.agent_id != agent_id:
            continue
        runs.append(
            {
                "id": chat.id,
                "title": (chat.summary or "").strip() or parsed[0],
                "updated_at": textql_router._proto_ts(chat.updated_at)
                or textql_router._proto_ts(chat.timestamp),
                "is_running": bool(chat.is_running),
            }
        )
    return {"runs": runs[:limit]}


@router.get("/runs/{chat_id}")
async def get_run(chat_id: str):
    """A run's prompt fields, input dataset, and cells, from one history read."""
    chats = textql_router._get_streaming().chats
    cells: list[dict] = []
    parsed: tuple[str, str] | None = None
    dataset: dict | None = None
    skip = 0
    while True:
        page = await chats.get_chat_history(
            chat_pb2.HistoryRequest(chat_id=chat_id, limit=200, skip=skip)
        )
        for cell in page.cells:
            cells.append(MessageToDict(cell))
            dataset = dataset or file_from_cell(cell)
            kind = cell.WhichOneof("value")
            if parsed is None and kind in ("md_cell", "ans_cell"):
                parsed = parse_prompt(getattr(cell, kind).content)
        skip += len(page.cells)
        if not page.has_more or not page.cells:
            break
    if parsed is None:
        raise HTTPException(404, "This chat is not a CSV run.")
    return {
        "file_name": parsed[0],
        "instruction": parsed[1],
        "dataset_id": dataset["id"] if dataset else None,
        "cells": cells,
    }


class StartRunRequest(BaseModel):
    dataset_id: str = Field(min_length=1)
    file_name: str = Field(min_length=1)
    instruction: str = ""


async def _run_events(body: StartRunRequest) -> AsyncGenerator[str, None]:
    chats = textql_router._get_streaming().chats
    chat_id = ""
    try:
        # The sibling route creates the chat with TEXTQL_AGENT_ID attached and
        # deletes it itself if that attachment fails.
        chat_id = (await textql_router.create_chat()).chat_id
        yield textql_router._sse({"type": "opened", "chatId": chat_id})
        await attach_uploaded_file(chats, chat_id, body.dataset_id, {})
        await chats.send_message(
            chat_pb2.SendRequest(
                chat_id=chat_id, message=build_prompt(body.file_name, body.instruction)
            )
        )
    except Exception:  # noqa: BLE001 - Headers are sent; failures go out as SSE.
        if chat_id:
            try:
                await chats.delete_chat(chat_pb2.DeleteChatRequest(chat_id=chat_id))
            except Exception:  # noqa: BLE001 - The run error below still reports.
                pass
        yield textql_router._sse(
            {"type": "runError", "runError": {"error": "The run could not start. Try again."}}
        )
        return
    yield textql_router._sse({"type": "runStarted"})
    async for frame in textql_router._watch_stream(chat_id, stop_on_run_complete=True):
        yield frame


@router.post("/runs")
async def start_run(body: StartRunRequest):
    """Create the run's chat, attach the upload, send the prompt, and stream the run.

    The first event names the chat, so the browser can route to it while the
    file is still being prepared.
    """
    return StreamingResponse(
        _run_events(body),
        media_type="text/event-stream",
        headers=textql_router._SSE_HEADERS,
    )


# Rows per GetDatasetValues page, and the most the grid will load.
_VALUES_PAGE = 5000
_MAX_ROWS = 200_000


def _cell_text(value) -> str:
    """One DataFrame value as the text the grid shows."""
    if isinstance(value, float):
        if value != value:  # NaN is the DataFrame's missing value.
            return ""
        return str(int(value)) if value.is_integer() else repr(value)
    if isinstance(value, bool):
        return "true" if value else "false"
    if isinstance(value, bytes):
        return value.decode("utf-8", errors="replace")
    if hasattr(value, "ToDatetime"):
        moment = value.ToDatetime(tzinfo=timezone.utc)
        # Date-only cells arrive as midnight UTC; show them as dates.
        return moment.date().isoformat() if moment.time() == datetime_time() else moment.isoformat()
    return str(value)


def _frame_rows(df) -> list[list[str]]:
    """A columnar DataFrame (record batches of typed columns) as rows of text."""
    rows: list[list[str]] = []
    for record in df.records:
        columns = sorted(record.columns, key=lambda c: c.column_index)
        values = []
        for column in columns:
            kind = column.WhichOneof("values")
            values.append([_cell_text(v) for v in getattr(column, kind).values] if kind else [])
        rows.extend(list(row) for row in zip(*values, strict=False))
    return rows


@router.get("/datasets/{dataset_id}/values")
async def dataset_values(dataset_id: str, request: Request):
    """An uploaded spreadsheet's rows, parsed by TextQL (Excel, ODS, Parquet).

    The same GetDatasetValues read the TextQL app uses to preview attachments.
    Its DataFrame cannot mark a missing number, so empty numeric cells come
    back filled; CSV and TSV inputs use their original bytes instead.
    """
    datasets = request.app.state.datasets
    columns: list[str] = []
    rows: list[list[str]] = []
    total = 0
    page = 0
    while True:
        resp = await datasets.get_dataset_values(
            dataset_pb2.GetDatasetValuesRequest(
                dataset_id=dataset_id, limit=_VALUES_PAGE, page=page
            )
        )
        if not columns:
            columns = [f.column_name for f in sorted(resp.df.schema, key=lambda f: f.column_index)]
            total = resp.num_rows
        batch = _frame_rows(resp.df)
        rows.extend(batch)
        page += 1
        if not batch or len(rows) >= min(total, _MAX_ROWS):
            break
    return {"columns": columns, "rows": rows[:_MAX_ROWS], "truncated": total > _MAX_ROWS}


def _signed_url(url: str) -> str:
    parts = urlsplit(url)
    if parts.scheme not in ("https", "http") or not parts.hostname or parts.username or parts.password:
        raise HTTPException(502, "TextQL returned an invalid storage URL.")
    return url


class UploadRequest(BaseModel):
    file_name: str = Field(min_length=1)


@router.post("/uploads")
async def register_upload(body: UploadRequest, request: Request):
    """Register an upload; the browser PUTs the bytes straight to the signed URL.

    The TextQL app's own upload pattern, so file size is not bounded by this server.
    """
    kind, content_type = classify_file(body.file_name)
    registered = await request.app.state.datasets.create_upload_presign_url(
        dataset_pb2.CreateUploadPresignUrlRequest(
            type=kind, file_name=body.file_name, ephemeral=True
        )
    )
    if not registered.dataset_id or registered.dataset_version < 1:
        raise HTTPException(502, "TextQL did not return a valid upload registration.")
    url = _signed_url(registered.presign_url)
    # The PUT must carry the content type the URL was signed for.
    headers = {"content-type": content_type}
    query = parse_qs(urlsplit(url).query)
    if "sig" in query and "sv" in query:
        headers["x-ms-blob-type"] = "BlockBlob"
    return {
        "dataset_id": registered.dataset_id,
        "dataset_version": registered.dataset_version,
        "url": url,
        "headers": headers,
    }


class CompleteUploadRequest(BaseModel):
    dataset_version: int = Field(ge=1)


@router.post("/uploads/{dataset_id}/complete")
async def complete_upload(dataset_id: str, body: CompleteUploadRequest, request: Request):
    """Finalize an upload once its bytes are in storage."""
    processed = await request.app.state.datasets.process_upload_presign_url(
        dataset_pb2.ProcessUploadPresignUrlRequest(
            dataset_id=dataset_id, dataset_version=body.dataset_version
        )
    )
    if processed.dataset.id != dataset_id:
        raise HTTPException(502, "TextQL did not confirm the uploaded file.")
    return {"id": dataset_id}


@router.get("/datasets/{dataset_id}/file")
async def dataset_file(dataset_id: str, request: Request):
    """A signed URL for an upload's original bytes; the browser reads it directly."""
    exported = await request.app.state.datasets.export_dataset(
        dataset_pb2.ExportDatasetRequest(dataset_id=dataset_id)
    )
    if not exported.presigned_url:
        raise HTTPException(502, "TextQL did not return an export URL.")
    return {"url": _signed_url(exported.presigned_url)}
