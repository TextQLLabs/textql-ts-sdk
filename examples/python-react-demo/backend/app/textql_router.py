"""APIRouter for TextQL multi-turn chat — prefix /v3/textql.

Registered in main.py via app.include_router(router).
The SDK singletons (_sdk, _streaming) are injected by the lifespan in
main.py at startup.
"""

import asyncio
import json
import logging
import re
from contextlib import aclosing
from typing import Any, AsyncGenerator, cast, Optional
from urllib.parse import urljoin, urlparse

logger = logging.getLogger(__name__)


import httpx
from fastapi import APIRouter, HTTPException, Path, Query
from fastapi.responses import Response, StreamingResponse
from pydantic import BaseModel, Field

from google.protobuf.json_format import MessageToDict

from textql_sdk._connect.public.chat_pb2 import WatchChatEvent, WatchChatRequest
from textql_sdk._connect.public.connector_pb2 import ConnectorType, GetConnectorsRequest
from textql_sdk.models import (
    ConnectError,
    TextqlRPCPublicParadigmParadigm,
    TextqlRPCPublicParadigmUniversalOptions,
    Universal,
)

# Injected at startup by main.lifespan
_sdk: Optional[Any] = None
_streaming: Optional[Any] = None
_connectors: Optional[Any] = None

WATCHDOG_TIMEOUT_S = 30.0

# `type` names the oneof case the way the payload key is spelled in the JSON
# below it, so the browser can read `event[event.type]`.
_PAYLOAD_JSON_NAMES = {
    field.name: field.json_name
    for field in WatchChatEvent.DESCRIPTOR.oneofs_by_name["payload"].fields
}

router = APIRouter(prefix="/v3/textql", tags=["TextQL"])


# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------

class ChatSummary(BaseModel):
    id: str
    summary: Optional[str] = None
    updated_at: Optional[str] = None
    is_running: bool = False


class ListChatsResponse(BaseModel):
    chats: list[ChatSummary]
    total_count: int
    has_more: bool


class ChatHistoryResponse(BaseModel):
    chat_id: str
    cells: list[dict]
    total_cells: int


class ConnectorSummary(BaseModel):
    id: int
    name: str
    type: str


class ListConnectorsResponse(BaseModel):
    connectors: list[ConnectorSummary]


class QuestionAnswer(BaseModel):
    selected: list[str] = []
    custom: Optional[str] = None
    inputs: list[str] = []
    provided: list[bool] = []


class SubmitQuestionsRequest(BaseModel):
    action: str = Field(..., description="'submit' to answer, 'dismiss' to skip")
    cellId: str = Field(..., description="ID of the questions cell being answered")
    answers: list[QuestionAnswer] = []


class CreateChatRequest(BaseModel):
    model: str = Field("MODEL_OPUS_4_8", description="TextQL model identifier")
    connector_ids: list[int] = Field([57], description="Connector IDs to enable")
    sql_enabled: bool = True
    python_enabled: bool = True


class CreateChatResponse(BaseModel):
    chat_id: str


class SendMessageRequest(BaseModel):
    message: str = Field(..., description="User message text")
    steering: bool = Field(
        False,
        description="If True, delivers the message into an active run to steer it",
    )
    stream: bool = Field(
        True,
        description="Return an SSE stream of events (True) or wait and return JSON (False)",
    )
    latest_cell_id: str = Field(
        "",
        description="final_cell_id from the previous turn's run_complete event. Pass this to skip replaying earlier turns.",
    )


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _get_sdk() -> Any:
    if _sdk is None:
        raise RuntimeError("SDK not initialised — lifespan has not run yet")
    return _sdk


def _get_streaming() -> Any:
    if _streaming is None:
        raise RuntimeError("Streaming client not initialised — lifespan has not run yet")
    return _streaming


def _connector_type_name(value: int) -> str:
    """The deployment's enum can be ahead of the SDK's copy of the proto."""
    return ConnectorType.Name(value) if value in ConnectorType.values() else "UNKNOWN"


def _get_connectors_client() -> Any:
    if _connectors is None:
        raise RuntimeError("Connector client not initialised — lifespan has not run yet")
    return _connectors


def _build_paradigm(req: CreateChatRequest) -> TextqlRPCPublicParadigmParadigm:
    return TextqlRPCPublicParadigmParadigm(
        type="TYPE_UNIVERSAL",
        version=1,
        options=Universal(
            universal=TextqlRPCPublicParadigmUniversalOptions(
                sql_enabled=req.sql_enabled,
                python_enabled=req.python_enabled,
                connector_ids=req.connector_ids,
            )
        ),
    )


def _event_to_dict(event: WatchChatEvent) -> dict:
    """The WatchChatEvent as protobuf JSON, with `type` naming the oneof case.

    Nothing is interpreted here: a `Cell` is a oneof over ~60 payload types, and
    which of them are worth drawing is a UI decision, so the whole snapshot goes
    to the browser and `src/lib/cells.ts` decides. Keeping the wire format the
    proto's own JSON means a cell type this demo has never heard of still
    arrives intact.

    The keys are protobuf JSON's, which is what demo2's own SSE handler emits
    (`protojson.Marshal`) and what the TypeScript demo's cell components already
    read: lowerCamelCase, unset fields omitted (`complete: false` simply won't be
    there), int64s as strings, enums as their names.
    """
    kind = event.WhichOneof("payload")
    return {
        "type": _PAYLOAD_JSON_NAMES.get(kind, "unknown"),
        **MessageToDict(event),
    }


async def _watch_stream(
    chat_id: str,
    latest_cell_id: str = "",
    cursor: str = "",
    stop_on_run_complete: bool = False,
) -> AsyncGenerator[str, None]:
    """Yield SSE-formatted lines from a watch_chat subscription.

    If stop_on_run_complete is True the generator returns after the first
    run_complete or run_error event (used by /send to bound the stream).
    """
    logger.info(
        "[_watch_stream] starting | chat_id=%s latest_cell_id=%r cursor=%r stop_on_run_complete=%s",
        chat_id, latest_cell_id, cursor, stop_on_run_complete,
    )
    streaming = _get_streaming()
    request = WatchChatRequest(chat_id=chat_id)
    if latest_cell_id:
        request.latest_complete_cell_id = latest_cell_id
    if cursor:
        request.resume_cursor = cursor

    stream = cast(
        AsyncGenerator[WatchChatEvent, None],
        streaming.chats.watch_chat(request),
    )
    event_count = 0
    async with aclosing(stream) as events:
        while True:
            try:
                event = await asyncio.wait_for(anext(events, None), WATCHDOG_TIMEOUT_S)
            except asyncio.TimeoutError:
                logger.warning(
                    "[_watch_stream] watchdog timeout after %.1fs | chat_id=%s events_received=%d",
                    WATCHDOG_TIMEOUT_S, chat_id, event_count,
                )
                yield f"data: {json.dumps({'type': 'timeout'})}\n\n"
                return

            if event is None:
                logger.info(
                    "[_watch_stream] stream ended normally | chat_id=%s events_received=%d",
                    chat_id, event_count,
                )
                yield f"data: {json.dumps({'type': 'streamEnded'})}\n\n"
                return

            data = _event_to_dict(event)
            event_count += 1
            event_type = data.get("type", "unknown")

            if event_type == "cell":
                logger.debug(
                    "[_watch_stream] SSE cell event | chat_id=%s #%d cell_id=%s kind=%s complete=%s",
                    chat_id, event_count,
                    event.cell.id,
                    event.cell.WhichOneof("value"),
                    event.cell.complete,
                )
            elif event_type == "runStarted":
                logger.info("[_watch_stream] SSE run_started | chat_id=%s", chat_id)
            elif event_type == "runComplete":
                logger.info(
                    "[_watch_stream] SSE run_complete | chat_id=%s final_cell_id=%s total_events=%d",
                    chat_id, event.run_complete.final_cell_id, event_count,
                )
            elif event_type == "runError":
                logger.error(
                    "[_watch_stream] SSE run_error | chat_id=%s error=%s",
                    chat_id, event.run_error.error,
                )
            elif event_type == "handoffPending":
                logger.info(
                    "[_watch_stream] SSE handoff_pending | chat_id=%s marker=%s",
                    chat_id, event.handoff_pending.handoff_marker,
                )
            else:
                logger.debug(
                    "[_watch_stream] SSE event | chat_id=%s #%d type=%s",
                    chat_id, event_count, event_type,
                )

            yield f"data: {json.dumps(data)}\n\n"

            if stop_on_run_complete and event_type in ("runComplete", "runError"):
                logger.info(
                    "[_watch_stream] stopping after terminal event '%s' | chat_id=%s",
                    event_type, chat_id,
                )
                return


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.get("/connectors", response_model=ListConnectorsResponse)
async def list_connectors():
    """The org's connectors, for the composer's connector picker.

    Goes over Connect rather than `sdk.connectors.get_connectors_async`: the
    generated REST model makes the per-warehouse `*Metadata` a required union,
    so a single connector with none set fails the whole page. The Connect client
    is the SDK's documented escape hatch for exactly this and speaks protobuf,
    which doesn't mind.
    """
    logger.info("[list_connectors] request")
    connectors = _get_connectors_client()
    resp = await connectors.get_connectors(GetConnectorsRequest())
    logger.info("[list_connectors] response | returned=%d", len(resp.connectors))
    return ListConnectorsResponse(
        connectors=[
            ConnectorSummary(
                id=c.id,
                name=c.name or f"Connector {c.id}",
                type=_connector_type_name(c.connector_type),
            )
            for c in resp.connectors
        ]
    )


@router.post("/questions")
async def submit_questions(body: SubmitQuestionsRequest):
    """Answer (or skip) a questions cell, which resumes the paused run.

    A run that asks for clarification parks on a `questions_cell` until this
    lands, so the watch stream goes quiet in between — that is the run waiting,
    not a dropped connection.
    """
    logger.info(
        "[submit_questions] request | action=%s cell_id=%s answers=%d",
        body.action, body.cellId, len(body.answers),
    )
    sdk = _get_sdk()
    answers = [answer.model_dump(exclude_none=True) for answer in body.answers]
    call = (
        sdk.chats.submit_questions_async
        if body.action == "submit"
        else sdk.chats.dismiss_questions_async
    )
    result = await call(cell_id=body.cellId, answers=answers)
    if isinstance(result, ConnectError):
        logger.error("[submit_questions] SDK error | %s", result)
        raise HTTPException(status_code=502, detail=f"{body.action} questions failed: {result}")
    return {"success": True}


@router.get("/chats", response_model=ListChatsResponse)
async def list_chats(
    search_term: Optional[str] = Query(None, description="Filter chats by keyword"),
    limit: int = Query(10, ge=1, le=100, description="Number of chats per page"),
    offset: int = Query(0, ge=0, description="Pagination offset"),
):
    """List chats in your org, newest first.

    Supports keyword search and pagination via `limit` / `offset`.
    Use `has_more` in the response to know if more pages exist.
    """
    logger.info("[list_chats] request | search_term=%r limit=%d offset=%d", search_term, limit, offset)
    sdk = _get_sdk()
    resp = await sdk.chats.get_all_async(
        limit=limit,
        offset=offset,
        search_term=search_term,
        sort_by="CHAT_SORT_FIELD_UPDATED_AT",
        sort_direction="CHAT_SORT_DIRECTION_DESC",
    )
    if isinstance(resp, ConnectError):
        logger.error("[list_chats] SDK error | %s", resp)
        raise HTTPException(status_code=502, detail=f"list_chats failed: {resp}")

    chats = resp.chats or []
    total = resp.total_count or 0
    has_more = total > offset + len(chats)
    logger.info("[list_chats] response | returned=%d total=%d has_more=%s", len(chats), total, has_more)
    return ListChatsResponse(
        chats=[
            ChatSummary(
                id=c.id,
                summary=c.summary or None,
                updated_at=c.updated_at.isoformat() if c.updated_at else None,
                is_running=bool(c.is_running),
            )
            for c in chats
        ],
        total_count=total,
        has_more=has_more,
    )


@router.get("/chats/{chat_id}/history", response_model=ChatHistoryResponse)
async def get_chat_history(
    chat_id: str = Path(..., description="Chat ID to retrieve history for"),
    limit: int = Query(50, ge=1, le=200, description="Cells per page"),
    skip: int = Query(0, ge=0, description="Number of cells to skip (pagination offset)"),
    all_pages: bool = Query(False, description="If True, fetch all pages and return every cell"),
):
    """Return the cell history for a chat, oldest-first.

    Cells are dumped by their wire aliases, which is the same JSON the watch
    stream sends, so the browser renders a replayed chat and a live one through
    one path. Use `limit` / `skip` to paginate, or set `all_pages=true` to
    collect every cell in one response.
    """
    logger.info(
        "[get_chat_history] request | chat_id=%s limit=%d skip=%d all_pages=%s",
        chat_id, limit, skip, all_pages,
    )
    sdk = _get_sdk()
    all_cells: list[dict] = []
    current_skip = skip
    page_num = 0

    while True:
        page_num += 1
        resp = await sdk.chats.get_history_async(chat_id=chat_id, limit=limit, skip=current_skip)
        if isinstance(resp, ConnectError):
            logger.error("[get_chat_history] SDK error on page %d | chat_id=%s error=%s", page_num, chat_id, resp)
            raise HTTPException(status_code=502, detail=f"get_history failed: {resp}")

        cells = resp.cells or []
        logger.debug(
            "[get_chat_history] page %d | chat_id=%s fetched=%d has_more=%s",
            page_num, chat_id, len(cells), getattr(resp, "has_more", False),
        )
        all_cells.extend(
            cell.model_dump(by_alias=True, exclude_none=True, mode="json") for cell in cells
        )

        current_skip += len(cells)
        if not all_pages or not resp.has_more or not cells:
            break

    logger.info("[get_chat_history] done | chat_id=%s total_cells=%d pages=%d", chat_id, len(all_cells), page_num)
    return ChatHistoryResponse(
        chat_id=chat_id,
        cells=all_cells,
        total_cells=len(all_cells),
    )


@router.post("/chats", response_model=CreateChatResponse)
async def create_chat(body: CreateChatRequest = CreateChatRequest()):
    """Create a new multi-turn chat session.

    Returns a `chat_id` you must pass to every subsequent call.
    The chat persists server-side; pass the same `chat_id` to resume it
    across API restarts.
    """
    logger.info(
        "[create_chat] request | model=%s connector_ids=%s sql=%s python=%s",
        body.model, body.connector_ids, body.sql_enabled, body.python_enabled,
    )
    sdk = _get_sdk()
    paradigm = _build_paradigm(body)
    result = await sdk.chats.create_chat_async(model=body.model, paradigm=paradigm)
    if isinstance(result, ConnectError):
        logger.error("[create_chat] SDK error | %s", result)
        raise HTTPException(status_code=502, detail=f"create_chat failed: {result}")
    if result.chat is None or not result.chat.id:
        logger.error("[create_chat] server returned chat with no ID")
        raise HTTPException(status_code=502, detail="Server returned a chat with no ID")
    logger.info("[create_chat] created | chat_id=%s", result.chat.id)
    return CreateChatResponse(chat_id=result.chat.id)


@router.post("/chats/{chat_id}/send")
async def send_message(
    body: SendMessageRequest,
    chat_id: str = Path(..., description="Chat ID returned by POST /v3/textql/chats"),
):
    """Send a user message and stream the model's response as SSE.

    **Multi-turn flow**

    1. `POST /v3/textql/chats` once → get `chat_id`.
    2. Each turn: `POST /v3/textql/chats/{chat_id}/send` with `{"message": "..."}`.
       Pass `latest_cell_id` from the previous turn's `run_complete` event to
       skip replaying earlier cells.
    3. Repeat with the same `chat_id` for every subsequent turn.

    **Steering**: set `steering: true` to redirect an active run mid-flight.

    **Non-streaming**: set `stream: false` to get a plain JSON response.
    """
    logger.info(
        "[send_message] request | chat_id=%s steering=%s stream=%s latest_cell_id=%r msg_len=%d",
        chat_id, body.steering, body.stream, body.latest_cell_id, len(body.message),
    )
    sdk = _get_sdk()

    sent = await sdk.chats.send_async(
        chat_id=chat_id, message=body.message, steering=body.steering
    )
    if isinstance(sent, ConnectError):
        logger.error("[send_message] SDK send error | chat_id=%s error=%s", chat_id, sent)
        raise HTTPException(status_code=502, detail=f"send failed: {sent}")

    logger.info("[send_message] message accepted | chat_id=%s cell_id=%s", chat_id, sent.cell_id)

    if body.stream:
        logger.info("[send_message] opening SSE stream | chat_id=%s", chat_id)
        return StreamingResponse(
            _watch_stream(chat_id, latest_cell_id=body.latest_cell_id, stop_on_run_complete=True),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "X-Accel-Buffering": "no",
                "X-Cell-Id": sent.cell_id or "",
                "Access-Control-Expose-Headers": "X-Cell-Id",
            },
        )

    logger.info("[send_message] non-streaming mode — collecting SSE events | chat_id=%s", chat_id)
    answers: dict[str, str] = {}
    final_cell_id = ""
    error_msg = ""
    async for sse_line in _watch_stream(chat_id, latest_cell_id=body.latest_cell_id, stop_on_run_complete=True):
        if not sse_line.startswith("data: "):
            continue
        data = json.loads(sse_line[len("data: "):])
        if data["type"] == "cell":
            cell = data["cell"]
            # The assistant's prose. Snapshots are cumulative and arrive a few
            # tokens at a time, so keep the latest per cell rather than
            # concatenating every partial the stream sent.
            prose = cell.get("mdCell") or cell.get("ansCell")
            if prose and cell.get("generated"):
                answers[cell["id"]] = prose.get("content", "")
        if data["type"] == "runComplete":
            final_cell_id = data["runComplete"].get("finalCellId", "")
        if data["type"] == "runError":
            error_msg = data["runError"].get("error", "unknown error")

    response = "\n\n".join(text for text in answers.values() if text.strip())
    logger.info(
        "[send_message] non-streaming complete | chat_id=%s final_cell_id=%s error=%r response_len=%d",
        chat_id, final_cell_id, error_msg or None, len(response),
    )
    return {
        "chat_id": chat_id,
        "cell_id": sent.cell_id,
        "final_cell_id": final_cell_id,
        "response": response,
        "error": error_msg or None,
    }


@router.get("/chats/{chat_id}/watch")
async def watch_chat(
    chat_id: str = Path(..., description="Chat ID to watch"),
    latest_cell_id: str = "",
    cursor: str = "",
):
    """Subscribe to the full SSE event stream for a chat.

    Unlike `/send`, this stream never closes on run_complete — it stays open
    across all turns. Pass `latest_cell_id` / `cursor` from a previous
    connection to replay only what was missed.
    """
    logger.info(
        "[watch_chat] SSE subscription | chat_id=%s latest_cell_id=%r cursor=%r",
        chat_id, latest_cell_id, cursor,
    )
    return StreamingResponse(
        _watch_stream(
            chat_id,
            latest_cell_id=latest_cell_id,
            cursor=cursor,
            stop_on_run_complete=False,
        ),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


@router.delete("/chats/{chat_id}")
async def close_chat(chat_id: str = Path(..., description="Chat ID to close")):
    """Signal that the client is done with this chat.

    The chat is not deleted server-side; you can resume the same `chat_id` later.
    """
    logger.info("[close_chat] client closed | chat_id=%s", chat_id)
    return {"chat_id": chat_id, "status": "closed_client_side"}


# ---------------------------------------------------------------------------
# Preview proxy
# ---------------------------------------------------------------------------

_USERCONTENT_HOST = "textqlusercontent.com"
_APP_HOST = "app.textql.com"

# Mirrors frontend/src/lib/chartFitShim.ts — charts are measured in the iframe
# and posted out so the panel can scale them to fit.
_CHART_FIT_SHIM = """
<style>html,body{margin:0!important;padding:0!important;}</style>
<script>(function(){var lw=0,lh=0;function measure(){var d=document.documentElement,b=document.body;var w=Math.max(d.scrollWidth,b?b.scrollWidth:0,d.offsetWidth);var h=Math.max(d.scrollHeight,b?b.scrollHeight:0,d.offsetHeight);if(w&&h&&(w!==lw||h!==lh)){lw=w;lh=h;try{parent.postMessage({__chartFit:true,w:w,h:h},'*');}catch(e){}}}window.addEventListener('load',measure);[60,250,600,1200].forEach(function(t){setTimeout(measure,t);});try{new ResizeObserver(measure).observe(document.documentElement);}catch(e){}})();</script>
"""

_HEAD_RE = re.compile(r"<head[^>]*>", re.IGNORECASE)

_DROPPED_HEADERS = {
    "x-frame-options",
    "content-encoding",
    "content-length",
    "transfer-encoding",
    "connection",
    "keep-alive",
}


def _is_allowed_preview_host(hostname: str) -> bool:
    return (
        hostname == _USERCONTENT_HOST
        or hostname.endswith(f".{_USERCONTENT_HOST}")
        or hostname == _APP_HOST
    )


def _preview_headers(upstream: httpx.Headers) -> dict[str, str]:
    headers = {
        key: value
        for key, value in upstream.items()
        if key.lower() not in _DROPPED_HEADERS
    }
    headers["content-disposition"] = "inline"
    headers["content-security-policy"] = "sandbox allow-scripts"
    return headers


def _inject_base_href(html: str, document_url: str) -> str:
    """Point relative sub-resources back at the upstream directory.

    Data-app HTML loads its runtime with relative URLs (`./modules/app.js`, the
    `./_runtime/...` importmap). Served through this same-origin proxy those
    would resolve against our host and 404, so a <base> restores the upstream
    origin, which allow-lists its own directory and serves `access-control-
    allow-origin: *`.
    """
    base_tag = f'<base href="{urljoin(document_url, ".")}">'
    match = _HEAD_RE.search(html)
    if match:
        return html[: match.end()] + base_tag + html[match.end() :]
    return base_tag + html


@router.get("/preview-proxy")
async def preview_proxy(
    url: str = Query(..., description="Absolute upstream preview URL"),
    fit: Optional[str] = Query(None, description="Pass 'chart' to inject the fit shim"),
):
    """Serve a preview asset same-origin.

    Preview assets live on textqlusercontent.com (and some sandbox embeds on
    app.textql.com), which only allow framing from the main TextQL app — a
    localhost iframe gets "refused to connect" and images 404 against the dev
    server. The frontend rewrites those URLs here via `toEmbeddablePreviewUrl`.
    """
    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https"):
        raise HTTPException(status_code=400, detail="Invalid protocol")
    if not _is_allowed_preview_host(parsed.hostname or ""):
        raise HTTPException(status_code=403, detail="Host not allowed")

    client = httpx.AsyncClient(follow_redirects=True, timeout=30.0)
    try:
        request = client.build_request("GET", url)
        upstream = await client.send(request, stream=True)
    except httpx.HTTPError as err:
        await client.aclose()
        logger.error("[preview_proxy] upstream failed | url=%s error=%s", url, err)
        raise HTTPException(status_code=502, detail="Preview fetch failed") from err

    content_type = upstream.headers.get("content-type", "")
    headers = _preview_headers(upstream.headers)

    if upstream.is_success and "text/html" in content_type:
        try:
            await upstream.aread()
            html = _inject_base_href(upstream.text, str(upstream.url))
        finally:
            await upstream.aclose()
            await client.aclose()
        if fit == "chart":
            html = (
                html.replace("</body>", f"{_CHART_FIT_SHIM}</body>")
                if "</body>" in html
                else html + _CHART_FIT_SHIM
            )
        return Response(content=html, status_code=upstream.status_code, headers=headers)

    async def body() -> AsyncGenerator[bytes, None]:
        try:
            async for chunk in upstream.aiter_bytes():
                yield chunk
        finally:
            await upstream.aclose()
            await client.aclose()

    return StreamingResponse(body(), status_code=upstream.status_code, headers=headers)
