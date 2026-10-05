"""Routes the CSV workspace needs beyond the agent-chat-demo API."""

import json
from collections.abc import AsyncGenerator

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

_PROMPT_HEAD = 'Forecast from the attached file "'
_UPDATE_HEAD = "Update the forecast with new parameters."
_PARAMS_MARKER = "\n\nParameters (JSON):\n"


class ForecastRequest(BaseModel):
    """What the browser sends per forecast: rules over the file's columns, plus the
    raw parameters so a reopened run can restore its form."""

    rules: list[str] = Field(min_length=1)
    measure: str = Field(min_length=1)
    scenario: str = Field(min_length=1)
    forecast_from: str = Field(pattern=r"^\d{4}-\d{2}$")
    forecast_to: str = Field(pattern=r"^\d{4}-\d{2}$")
    parameters: dict


def _forecast_task(body: ForecastRequest) -> str:
    rules = "\n".join(f"- {rule}" for rule in body.rules)
    return f"""Scope the rows with these rules:
{rules}

Then:
1. Total {body.measure} by month over the scoped rows (the actual period).
2. Forecast each month from {body.forecast_from} to {body.forecast_to} under the "{body.scenario}" scenario, with an 80% interval.
3. Save one CSV file named "Forecast {body.forecast_from} to {body.forecast_to}.csv" with columns month, kind (actual or forecast), value, lower, upper.
4. Draw one chart of the actuals and the forecast with its interval.
5. In two or three sentences, say what drives the forecast and how it changed from any earlier forecast in this chat.
Do not ask questions; use these parameters as given.{_PARAMS_MARKER}{json.dumps(body.parameters)}"""


def build_prompt(file_name: str, body: ForecastRequest) -> str:
    return (
        f"{_PROMPT_HEAD}{file_name.replace(chr(34), chr(39))}\", which holds financial "
        f"transactions.\n\n{_forecast_task(body)}"
    )


def build_update_prompt(body: ForecastRequest) -> str:
    return f"{_UPDATE_HEAD}\n\n{_forecast_task(body)}"


def parse_file_name(text: str) -> str | None:
    """The file name from a run's first prompt, or None for any other chat."""
    if not text.startswith(_PROMPT_HEAD):
        return None
    return text[len(_PROMPT_HEAD) :].split('"', 1)[0] or None


def parse_parameters(text: str) -> dict | None:
    if not (text.startswith(_PROMPT_HEAD) or text.startswith(_UPDATE_HEAD)):
        return None
    _, marker, raw = text.partition(_PARAMS_MARKER)
    try:
        return json.loads(raw) if marker else None
    except ValueError:
        return None


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
        file_name = parse_file_name((chat.preview or "").strip())
        if not file_name or chat.agent_id != agent_id:
            continue
        runs.append(
            {
                "id": chat.id,
                "title": (chat.summary or "").strip() or file_name,
                "updated_at": textql_router._proto_ts(chat.updated_at)
                or textql_router._proto_ts(chat.timestamp),
                "is_running": bool(chat.is_running),
            }
        )
    return {"runs": runs[:limit]}


@router.get("/runs/{chat_id}")
async def get_run(chat_id: str):
    """A run's file name, its prompts' parameters, input dataset, and cells, from one history read."""
    chats = textql_router._get_streaming().chats
    cells: list[dict] = []
    file_name: str | None = None
    prompts: list[dict] = []
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
            if kind in ("md_cell", "ans_cell"):
                content = getattr(cell, kind).content
                file_name = file_name or parse_file_name(content)
                if (parameters := parse_parameters(content)) is not None:
                    prompts.append({"cell_id": cell.id, "parameters": parameters})
        skip += len(page.cells)
        if not page.has_more or not page.cells:
            break
    if file_name is None:
        raise HTTPException(404, "This chat is not a CSV run.")
    return {
        "file_name": file_name,
        "prompts": prompts,
        "dataset_id": dataset["id"] if dataset else None,
        "cells": cells,
    }


class StartRunRequest(ForecastRequest):
    dataset_id: str = Field(min_length=1)
    file_name: str = Field(min_length=1)


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
                chat_id=chat_id, message=build_prompt(body.file_name, body)
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


class UpdateRunRequest(ForecastRequest):
    latest_cell_id: str = ""


@router.post("/runs/{chat_id}/messages")
async def update_run(chat_id: str, body: UpdateRunRequest):
    """Re-forecast in the same chat with new parameters, streaming only the new turn."""
    await textql_router._require_agent(chat_id)
    await textql_router._get_streaming().chats.send_message(
        chat_pb2.SendRequest(chat_id=chat_id, message=build_update_prompt(body))
    )
    return StreamingResponse(
        textql_router._watch_stream(
            chat_id, latest_cell_id=body.latest_cell_id, stop_on_run_complete=True
        ),
        media_type="text/event-stream",
        headers=textql_router._SSE_HEADERS,
    )


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
