"""APIRouter for TextQL multi-turn chat — prefix /v3/textql.

Registered in main.py via app.include_router(router).
The SDK singletons (_sdk, _streaming) are injected by the lifespan in
main.py at startup.
"""

import asyncio
import json
import logging
import os
import re
from contextlib import aclosing
from datetime import datetime, timedelta, timezone
from typing import Any, AsyncGenerator, cast, Optional
from urllib.parse import urljoin, urlparse

logger = logging.getLogger(__name__)


import httpx
from fastapi import APIRouter, HTTPException, Path, Query
from fastapi.responses import Response, StreamingResponse
from pydantic import BaseModel, Field

from google.protobuf.json_format import MessageToDict

from textql_sdk._connect.public.chat_pb2 import (
    ChatSortDirection,
    ChatSortField,
    ChatSource,
    GetChatsRequest,
    GetMembersWithChatsRequest,
    WatchChatEvent,
    WatchChatRequest,
)
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
_http: Optional[httpx.AsyncClient] = None

WATCHDOG_TIMEOUT_S = 30.0

# Every SSE route sends these; /send adds its own on top.
_SSE_HEADERS = {
    "Cache-Control": "no-cache",
    "X-Accel-Buffering": "no",
}

_FALLBACK_USERCONTENT_HOST = "textqlusercontent.com"
_FALLBACK_APP_HOST = "app.textql.com"


def _usercontent_host() -> str:
    """Read per call: .env loads after this import."""
    return os.getenv("VITE_USERCONTENT_HOST") or _FALLBACK_USERCONTENT_HOST


def _app_host() -> str:
    return os.getenv("VITE_APP_HOST") or _FALLBACK_APP_HOST


def _default_connector_ids() -> list[int]:
    """`TEXTQL_CONNECTOR_IDS` as ints, or empty to let create_chat ask the org.

    Read per call: .env loads after this import.
    """
    raw = os.getenv("TEXTQL_CONNECTOR_IDS")
    if not raw:
        return []
    try:
        return [int(part) for part in raw.split(",") if part.strip()]
    except ValueError:
        logger.warning("[config] ignoring malformed TEXTQL_CONNECTOR_IDS=%r", raw)
        return []


# `type` names the oneof case the way the payload key is spelled in the JSON
# below it, so the browser can read `event[event.type]`.
_PAYLOAD_JSON_NAMES = {
    field.name: field.json_name
    for field in WatchChatEvent.DESCRIPTOR.oneofs_by_name["payload"].fields
}

router = APIRouter(prefix="/v3/textql", tags=["TextQL"])


class ChatSummary(BaseModel):
    """One row, in both spellings the two callers expect.

    The sidebar reads the snake_case fields; ThreadsPage's `parse` reads the
    camelCase ones. Serving one row shape beats maintaining two list routes.
    """

    id: str
    summary: Optional[str] = None
    updated_at: Optional[str] = None
    is_running: bool = False
    title: str
    createdBy: Optional[str] = None
    source: Optional[str] = None
    lastMessageAt: Optional[str] = None
    updatedAt: Optional[str] = None


class ListChatsResponse(BaseModel):
    chats: list[ChatSummary]
    total_count: int
    has_more: bool
    page: int
    pageSize: int
    totalCount: int
    hasMore: bool


class MemberOption(BaseModel):
    id: str
    name: Optional[str] = None
    email: Optional[str] = None
    pictureUrl: Optional[str] = None


class ListChatMembersResponse(BaseModel):
    members: list[MemberOption]


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


class ResolveCellRequest(BaseModel):
    kind: str = Field(..., description="'ontology' or 'context_prompt'")
    action: str = Field(..., description="'approve' or 'reject'")


class ConfigResponse(BaseModel):
    app_url: str
    email: Optional[str] = None


class CreateChatRequest(BaseModel):
    model: str = Field("MODEL_OPUS_4_8", description="TextQL model identifier")
    connector_ids: list[int] = Field(
        default_factory=_default_connector_ids,
        description="Connector IDs to enable",
    )
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


def _require(value: Any, name: str) -> Any:
    if value is None:
        raise RuntimeError(f"{name} not initialised — lifespan has not run yet")
    return value


def _get_sdk() -> Any:
    return _require(_sdk, "SDK")


def _get_streaming() -> Any:
    return _require(_streaming, "Streaming client")


def _get_connectors_client() -> Any:
    return _require(_connectors, "Connector client")


def _get_http() -> httpx.AsyncClient:
    return cast(httpx.AsyncClient, _require(_http, "HTTP client"))


def _unwrap(result: Any, op: str, **context: Any) -> Any:
    """The SDK result, or a 502 when the call came back as a ConnectError."""
    if isinstance(result, ConnectError):
        where = " ".join(f"{key}={value}" for key, value in context.items())
        logger.error("[%s] SDK error | %s%s", op, f"{where} | " if where else "", result)
        raise HTTPException(status_code=502, detail=f"{op} failed: {result}")
    return result


def _connector_type_name(value: int) -> str:
    """The deployment's enum can be ahead of the SDK's copy of the proto."""
    return ConnectorType.Name(value) if value in ConnectorType.values() else "UNKNOWN"


# A halted cell is resolved by its own RPC pair; the cell id is the whole request.
_RESOLVERS = {
    ("ontology", "approve"): "approve_ontology_change_async",
    ("ontology", "reject"): "reject_ontology_change_async",
    ("context_prompt", "approve"): "approve_context_prompt_change_async",
    ("context_prompt", "reject"): "reject_context_prompt_change_async",
}


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


def _sse(payload: dict) -> str:
    return f"data: {json.dumps(payload)}\n\n"


async def _watch_events(
    chat_id: str,
    latest_cell_id: str = "",
    cursor: str = "",
    stop_on_run_complete: bool = False,
) -> AsyncGenerator[dict, None]:
    """Event dicts from a watch_chat subscription.

    stop_on_run_complete bounds the stream at the first run_complete or run_error,
    which is what /send needs and /watch does not.
    """
    logger.info(
        "[_watch_events] starting | chat_id=%s latest_cell_id=%r cursor=%r stop_on_run_complete=%s",
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
                    "[_watch_events] watchdog timeout after %.1fs | chat_id=%s events_received=%d",
                    WATCHDOG_TIMEOUT_S, chat_id, event_count,
                )
                yield {"type": "timeout"}
                return

            if event is None:
                logger.info(
                    "[_watch_events] stream ended normally | chat_id=%s events_received=%d",
                    chat_id, event_count,
                )
                yield {"type": "streamEnded"}
                return

            data = _event_to_dict(event)
            event_count += 1
            event_type = data.get("type", "unknown")

            if event_type == "runError":
                logger.error(
                    "[_watch_events] SSE run_error | chat_id=%s error=%s",
                    chat_id, event.run_error.error,
                )
            else:
                logger.debug(
                    "[_watch_events] SSE %s | chat_id=%s #%d", event_type, chat_id, event_count
                )

            yield data

            if stop_on_run_complete and event_type in ("runComplete", "runError"):
                logger.info(
                    "[_watch_events] stopping after terminal event '%s' | chat_id=%s",
                    event_type, chat_id,
                )
                return


async def _watch_stream(
    chat_id: str,
    latest_cell_id: str = "",
    cursor: str = "",
    stop_on_run_complete: bool = False,
) -> AsyncGenerator[str, None]:
    events = _watch_events(chat_id, latest_cell_id, cursor, stop_on_run_complete)
    async with aclosing(events) as stream:
        async for event in stream:
            yield _sse(event)


_SORT_FIELDS = {
    "updated": ChatSortField.CHAT_SORT_FIELD_UPDATED_AT,
    "created": ChatSortField.CHAT_SORT_FIELD_CREATED_AT,
    "name": ChatSortField.CHAT_SORT_FIELD_NAME,
}

_SOURCE_LABELS = {
    ChatSource.CHAT_SOURCE_THREAD: "Thread",
    ChatSource.CHAT_SOURCE_PLAYBOOK: "Playbook",
    ChatSource.CHAT_SOURCE_SLACK: "Slack",
    ChatSource.CHAT_SOURCE_FEED: "Feed",
    ChatSource.CHAT_SOURCE_TEAMS: "Teams",
    ChatSource.CHAT_SOURCE_SMS: "SMS",
    ChatSource.CHAT_SOURCE_MCP: "MCP",
    ChatSource.CHAT_SOURCE_SYSTEM: "System",
}

_DATE_PRESET_DAYS = {"today": 1, "week": 7, "month": 30, "quarter": 90}


def _created_after(value: Optional[str]) -> Optional[datetime]:
    """Date facet value — a preset id or `since:YYYY-MM-DD` — to a lower bound.

    Mirrors `createdAfterFor` in the frontend's tableFilter; the facet sends
    whichever spelling the drilldown produced.
    """
    if not value:
        return None
    if value.startswith("since:"):
        try:
            day = datetime.strptime(value[len("since:"):], "%Y-%m-%d")
        except ValueError:
            return None
        return day.replace(tzinfo=timezone.utc)
    days = _DATE_PRESET_DAYS.get(value)
    if days is None:
        return None
    return datetime.now(timezone.utc) - timedelta(days=days)


def _chat_title(chat: Any) -> str:
    return (chat.summary or "").strip() or (chat.preview or "").strip() or "New chat"


def _chat_creator(chat: Any) -> Optional[str]:
    return (chat.agent_name or "").strip() or (chat.creator_email or "").strip() or None


def _proto_ts(value: Any) -> Optional[str]:
    """A protobuf Timestamp to ISO-8601, or None when it was never set."""
    if value is None or not value.seconds and not value.nanos:
        return None
    return value.ToDatetime(tzinfo=timezone.utc).isoformat()


async def _first_connector_id() -> list[int]:
    """The org's first connector, for a request that named none.

    A chat's paradigm is fixed at creation and one with no connector fails every
    run, so guessing beats failing a turn later. The frontend picks explicitly;
    this is for a bare `POST /chats`.
    """
    connectors = _get_connectors_client()
    resp = await connectors.get_connectors(GetConnectorsRequest())
    if not resp.connectors:
        raise HTTPException(
            status_code=400,
            detail="This org has no connectors, so a chat cannot be created.",
        )
    return [resp.connectors[0].id]


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

    The run parks on the cell until this lands; the watch stream going quiet in
    between is the run waiting, not a dropped connection.
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
    _unwrap(await call(cell_id=body.cellId, answers=answers), f"{body.action} questions",
            cell_id=body.cellId)
    return {"success": True}


@router.get("/config", response_model=ConfigResponse)
async def get_config():
    """The host the SDK is pointed at, and the member the API key is.

    The email is the identity the chat messages should be attributed to.
    """
    sdk = _get_sdk()
    email: Optional[str] = None
    try:
        me = await sdk.rbac.who_am_i_async(body={})
        if not isinstance(me, ConnectError) and isinstance(me.email, str) and me.email.strip():
            email = me.email.strip()
    except Exception as err:
        logger.warning("[get_config] WhoAmI failed; message attribution will fall back | %s", err)
    return ConfigResponse(
        app_url=sdk.sdk_configuration.get_server_details()[0].rstrip("/"),
        email=email,
    )


@router.post("/cells/{cell_id}/resolve")
async def resolve_cell(
    body: ResolveCellRequest,
    cell_id: str = Path(..., description="ID of the halted cell"),
):
    """Approve or reject a halted cell, which releases the paused run.

    An ontology patch or a context-prompt edit parks the run — and the watch
    stream — until someone says yes or no.
    """
    logger.info("[resolve_cell] request | cell_id=%s kind=%s action=%s", cell_id, body.kind, body.action)
    method = _RESOLVERS.get((body.kind, body.action))
    if method is None:
        raise HTTPException(status_code=400, detail=f"Cannot {body.action} a {body.kind} cell")

    _unwrap(await getattr(_get_sdk().chats, method)(cell_id=cell_id), method, cell_id=cell_id)
    return {"cell_id": cell_id, "kind": body.kind, "action": body.action}


@router.get("/chats", response_model=ListChatsResponse)
async def list_chats(
    search_term: Optional[str] = Query(None, description="Filter chats by keyword"),
    q: Optional[str] = Query(None, description="Same as search_term; what FilterToolbar sends"),
    limit: int = Query(10, ge=1, le=100, description="Number of chats per page"),
    offset: int = Query(0, ge=0, description="Pagination offset"),
    page: Optional[int] = Query(None, ge=0, description="Page index; overrides offset when set"),
    page_size: int = Query(30, ge=1, le=100, description="Rows per page when using `page`"),
    creator: list[str] = Query([], description="Creator member ids"),
    source: list[str] = Query([], description="ChatSource enum names"),
    scope: list[str] = Query([], description="'bookmarked' and/or 'shared'"),
    date: Optional[str] = Query(None, description="Preset id or since:YYYY-MM-DD"),
    sort: str = Query("updated", description="updated | created | name"),
    dir: str = Query("desc", description="asc | desc"),
):
    """List chats in your org, newest first.

    Over Connect rather than `sdk.chats.get_all_async` for the same reason as
    list_connectors: the facets ThreadsPage sends (creator ids, sources,
    shared-with-me) are proto fields the generated REST model doesn't carry.
    Two paging dialects: `page` wins over `limit`/`offset`, and the response
    answers in both spellings.
    """
    if page is not None:
        limit, offset = page_size, page * page_size
    term = (q or search_term or "").strip()
    logger.info(
        "[list_chats] request | q=%r limit=%d offset=%d creator=%d source=%s scope=%s date=%r sort=%s/%s",
        term, limit, offset, len(creator), source, scope, date, sort, dir,
    )

    request = GetChatsRequest(
        # Org-wide: surface everyone's threads, not just the caller's.
        member_only=False,
        limit=limit,
        offset=offset,
        sort_by=_SORT_FIELDS.get(sort, ChatSortField.CHAT_SORT_FIELD_UPDATED_AT),
        sort_direction=(
            ChatSortDirection.CHAT_SORT_DIRECTION_ASC
            if dir == "asc"
            else ChatSortDirection.CHAT_SORT_DIRECTION_DESC
        ),
        exclude_batch_runs=True,
    )
    if term:
        request.search_term = term
    if creator:
        request.creator_member_ids.extend(creator)
    # The facet sends raw enum names; drop anything this proto doesn't know
    # rather than passing it through to the RPC.
    known = [name for name in source if name in ChatSource.keys()]
    if known:
        request.sources.extend(ChatSource.Value(name) for name in known)
    if "bookmarked" in scope:
        request.bookmarked_only = True
    if "shared" in scope:
        request.shared_with_me = True
    created_after = _created_after(date)
    if created_after is not None:
        request.created_after.FromDatetime(created_after)

    resp = await _get_streaming().chats.get_chats(request)

    chats = list(resp.chats)
    total = resp.total_count or 0
    has_more = total > offset + len(chats)
    logger.info("[list_chats] response | returned=%d total=%d has_more=%s", len(chats), total, has_more)

    rows = []
    for c in chats:
        updated = _proto_ts(c.updated_at) or _proto_ts(c.timestamp)
        rows.append(
            ChatSummary(
                id=c.id,
                summary=c.summary or None,
                updated_at=updated,
                is_running=bool(c.is_running),
                title=_chat_title(c),
                createdBy=_chat_creator(c),
                source=_SOURCE_LABELS.get(c.source),
                lastMessageAt=updated,
                updatedAt=updated,
            )
        )
    return ListChatsResponse(
        chats=rows,
        total_count=total,
        has_more=has_more,
        page=page or 0,
        pageSize=limit,
        totalCount=total,
        hasMore=has_more,
    )


@router.get("/chats/members", response_model=ListChatMembersResponse)
async def list_chat_members():
    """Creator facet options for the threads toolbar.

    Every member who has authored a chat, so the facet only lists people the
    list can actually be narrowed to.
    """
    resp = await _get_streaming().chats.get_members_with_chats(GetMembersWithChatsRequest())
    logger.info("[list_chat_members] response | returned=%d", len(resp.members))
    return ListChatMembersResponse(
        members=[
            MemberOption(
                id=m.member_id,
                name=m.member_name or None,
                email=m.member_email or None,
                pictureUrl=m.member_picture_url or None,
            )
            for m in resp.members
            if m.member_id
        ]
    )


@router.get("/chats/{chat_id}/history", response_model=ChatHistoryResponse)
async def get_chat_history(
    chat_id: str = Path(..., description="Chat ID to retrieve history for"),
    limit: Optional[int] = Query(
        None, ge=1, le=200, description="Cells per page; defaults to 50, or 200 with all_pages"
    ),
    skip: int = Query(0, ge=0, description="Number of cells to skip (pagination offset)"),
    all_pages: bool = Query(False, description="If True, fetch all pages and return every cell"),
):
    """Return the cell history for a chat, oldest-first.

    Cells are dumped by their wire aliases, which is the same JSON the watch
    stream sends, so the browser renders a replayed chat and a live one through
    one path.
    """
    # Collecting the whole chat pays a round trip per page, so take the biggest
    # page the RPC allows unless the caller asked for a specific size.
    limit = limit or (200 if all_pages else 50)
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
        resp = _unwrap(
            await sdk.chats.get_history_async(chat_id=chat_id, limit=limit, skip=current_skip),
            "get_history", chat_id=chat_id, page=page_num,
        )

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
    """Create a chat. The returned `chat_id` is what every other call takes, and
    it survives API restarts — pass it back to resume the same conversation.
    """
    logger.info(
        "[create_chat] request | model=%s connector_ids=%s sql=%s python=%s",
        body.model, body.connector_ids, body.sql_enabled, body.python_enabled,
    )
    sdk = _get_sdk()
    if not body.connector_ids:
        body.connector_ids = await _first_connector_id()
        logger.info("[create_chat] defaulted connector_ids=%s", body.connector_ids)
    paradigm = _build_paradigm(body)
    result = _unwrap(
        await sdk.chats.create_chat_async(model=body.model, paradigm=paradigm), "create_chat"
    )
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
    """Send a turn; SSE by default, or the run's cells as JSON with `stream: false`.

    `latest_cell_id` (the previous turn's `run_complete`) skips replaying earlier
    cells; `steering: true` redirects an active run instead of queueing a turn.
    """
    logger.info(
        "[send_message] request | chat_id=%s steering=%s stream=%s latest_cell_id=%r msg_len=%d",
        chat_id, body.steering, body.stream, body.latest_cell_id, len(body.message),
    )
    sdk = _get_sdk()

    sent = _unwrap(
        await sdk.chats.send_async(chat_id=chat_id, message=body.message, steering=body.steering),
        "send", chat_id=chat_id,
    )

    logger.info("[send_message] message accepted | chat_id=%s cell_id=%s", chat_id, sent.cell_id)

    if body.stream:
        logger.info("[send_message] opening SSE stream | chat_id=%s", chat_id)
        return StreamingResponse(
            _watch_stream(chat_id, latest_cell_id=body.latest_cell_id, stop_on_run_complete=True),
            media_type="text/event-stream",
            headers={
                **_SSE_HEADERS,
                "X-Cell-Id": sent.cell_id or "",
                "Access-Control-Expose-Headers": "X-Cell-Id",
            },
        )

    logger.info("[send_message] non-streaming mode — collecting events | chat_id=%s", chat_id)
    # Snapshots are cumulative and arrive a few tokens at a time, so the last one
    # per cell id is the whole cell. Which of them are prose is the caller's call.
    cells: dict[str, dict] = {}
    final_cell_id = ""
    error_msg = ""
    async for data in _watch_events(chat_id, latest_cell_id=body.latest_cell_id, stop_on_run_complete=True):
        if data["type"] == "cell":
            cells[data["cell"]["id"]] = data["cell"]
        elif data["type"] == "runComplete":
            final_cell_id = data["runComplete"].get("finalCellId", "")
        elif data["type"] == "runError":
            error_msg = data["runError"].get("error", "unknown error")

    logger.info(
        "[send_message] non-streaming complete | chat_id=%s final_cell_id=%s error=%r cells=%d",
        chat_id, final_cell_id, error_msg or None, len(cells),
    )
    return {
        "chat_id": chat_id,
        "cell_id": sent.cell_id,
        "final_cell_id": final_cell_id,
        "cells": list(cells.values()),
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
        headers=_SSE_HEADERS,
    )


@router.delete("/chats/{chat_id}")
async def close_chat(chat_id: str = Path(..., description="Chat ID to close")):
    """Signal that the client is done. The chat is not deleted server-side; the
    same `chat_id` resumes it later.
    """
    logger.info("[close_chat] client closed | chat_id=%s", chat_id)
    return {"chat_id": chat_id, "status": "closed_client_side"}

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
    usercontent = _usercontent_host()
    return (
        hostname == usercontent
        or hostname.endswith(f".{usercontent}")
        or hostname == _app_host()
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

    client = _get_http()
    try:
        request = client.build_request("GET", url)
        upstream = await client.send(request, stream=True)
    except httpx.HTTPError as err:
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

    return StreamingResponse(body(), status_code=upstream.status_code, headers=headers)
