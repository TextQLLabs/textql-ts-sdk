"""Connecting a user to TextQL over OAuth, and acting as them afterwards.

    GET  /v3/auth/textql/connect     authorization_url(...)  -> 302 to TextQL
    GET  /callback?code=&state=      exchange_code(...)      -> textql_tokens row
    POST /v3/auth/textql/disconnect  delete the row, revoke the grant

Every /v3/textql request then goes through `bind_textql`, which loads the
user's tokens, refreshes them if needed, and binds a TextQL client built from
them, so the request acts as that member with their permissions.
"""

import hmac
import logging
import os
import ssl
import threading
import time
from contextvars import ContextVar
from dataclasses import dataclass, field
from typing import Any, Optional

import httpx
import truststore
from fastapi import APIRouter, HTTPException, Request
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import RedirectResponse

from textql_sdk import Textql
from textql_sdk._connect.public.connector_connect import ConnectorServiceClient
from textql_sdk.oauth import (
    OAuthRefreshError,
    OAuthTokens,
    TokenAuth,
    TokenManager,
    authorization_url,
    exchange_code,
)
from textql_sdk.streaming import create_connect_client, create_streaming_client
from sqlalchemy import Connection, Row, delete, select, update
from sqlalchemy.dialects.sqlite import insert

from app.db import engine, sessions, textql_tokens, users
from app.users import SESSION_COOKIE, require_user

logger = logging.getLogger(__name__)

SCOPES = ["api:read", "api:write"]
# Register exactly this on the OAuth application. Vite proxies it to the backend.
REDIRECT_URI = os.environ.get("TEXTQL_REDIRECT_URI", "http://localhost:5173/callback")


def server_url() -> str:
    return (os.getenv("TEXTQL_SERVER_URL") or "https://app.textql.com").rstrip("/")


def _client_credentials() -> tuple[str, str]:
    client_id, client_secret = os.getenv("TEXTQL_CLIENT_ID"), os.getenv("TEXTQL_CLIENT_SECRET")
    if not client_id or not client_secret:
        raise RuntimeError("TEXTQL_CLIENT_ID and TEXTQL_CLIENT_SECRET must be set; copy .env.example to .env")
    return client_id, client_secret


def _save_tokens(conn: Connection, user_id: int, t: OAuthTokens) -> None:
    values = {
        "access_token": t.access_token,
        "refresh_token": t.refresh_token,
        "expires_at": t.expires_at or time.time() + 3600,
        "updated_at": time.time(),
    }
    conn.execute(
        insert(textql_tokens)
        .values(user_id=user_id, **values)
        .on_conflict_do_update(index_elements=[textql_tokens.c.user_id], set_=values)
    )


# --- Per-user TextQL clients ---------------------------------------------------

@dataclass
class UserClients:
    manager: TokenManager
    sdk: Textql
    streaming: Any
    connectors: Any
    http: httpx.AsyncClient
    # The connection holding the write lock while this user's refresh runs, so
    # on_tokens writes inside that transaction instead of waiting on it.
    locked_conn: dict = field(default_factory=lambda: {"conn": None})


_clients: dict[int, UserClients] = {}
_clients_lock = threading.Lock()
_current: ContextVar[Optional[UserClients]] = ContextVar("textql_user_clients", default=None)

_ssl_ctx = truststore.SSLContext(ssl.PROTOCOL_TLS_CLIENT)


async def _connect_protocol_version(request: httpx.Request) -> None:
    # The published Python SDK sends "1.0", which the server rejects with a 400.
    # Remove once textql-python-v3#70 is in the installed build.
    if request.headers.get("Connect-Protocol-Version") == "1.0":
        request.headers["Connect-Protocol-Version"] = "1"


def _build_clients(user_id: int, row: Row) -> UserClients:
    locked_conn: dict = {"conn": None}

    def persist(t: OAuthTokens) -> None:
        conn = locked_conn["conn"]
        if conn is not None:
            _save_tokens(conn, user_id, t)
            return
        # A refresh after a 401 mid-request, outside the request-start lock.
        with engine.begin() as conn:
            _save_tokens(conn, user_id, t)

    client_id, client_secret = _client_credentials()
    manager = TokenManager(
        row.access_token,
        row.refresh_token,
        client_id=client_id,
        client_secret=client_secret,
        expires_at=row.expires_at,
        on_tokens=persist,
        server_url=server_url(),
    )
    http = httpx.AsyncClient(
        auth=TokenAuth(manager),
        follow_redirects=True,
        timeout=httpx.Timeout(None, connect=10.0),
        verify=_ssl_ctx,
        event_hooks={"request": [_connect_protocol_version]},
    )
    sdk = Textql(server_url=server_url(), async_client=http)
    return UserClients(
        manager=manager,
        sdk=sdk,
        streaming=create_streaming_client(sdk, tokens=manager),
        connectors=create_connect_client(ConnectorServiceClient, sdk, tokens=manager),
        http=http,
        locked_conn=locked_conn,
    )


class NotConnected(HTTPException):
    def __init__(self) -> None:
        super().__init__(409, "textql_not_connected")


def _clients_for(user_id: int) -> UserClients:
    """This user's clients with an access token good for at least a minute.

    Refresh tokens are single use, so the check-and-refresh runs under SQLite's
    write lock (`BEGIN IMMEDIATE`): concurrent requests, even from another
    process, never spend the same refresh token twice.
    """
    with engine.begin() as conn:  # BEGIN IMMEDIATE, see db.py
        row = conn.execute(select(textql_tokens).where(textql_tokens.c.user_id == user_id)).first()
        if row is not None:
            with _clients_lock:
                clients = _clients.get(user_id)
                if clients is None or clients.manager.tokens.refresh_token != row.refresh_token:
                    clients = _build_clients(user_id, row)
                    _clients[user_id] = clients

            clients.locked_conn["conn"] = conn
            try:
                clients.manager.access_token()
                return clients
            except OAuthRefreshError as e:
                if e.error != "invalid_grant":
                    raise
                logger.info("TextQL grant for user %s is gone (%s); asking them to reconnect", user_id, e)
                conn.execute(delete(textql_tokens).where(textql_tokens.c.user_id == user_id))
            finally:
                clients.locked_conn["conn"] = None
    _drop_clients(user_id)
    raise NotConnected()


def _drop_clients(user_id: int) -> None:
    with _clients_lock:
        _clients.pop(user_id, None)


async def bind_textql(request: Request) -> None:
    """Router dependency for /v3/textql: makes the caller's clients current."""
    user_id = await run_in_threadpool(require_user, request)
    _current.set(await run_in_threadpool(_clients_for, user_id))


def current_clients() -> UserClients:
    clients = _current.get()
    if clients is None:
        raise RuntimeError("no TextQL clients bound; is bind_textql on this route?")
    return clients


async def close_all() -> None:
    with _clients_lock:
        clients = list(_clients.values())
        _clients.clear()
    for c in clients:
        await c.http.aclose()


# --- Routes ------------------------------------------------------------------

router = APIRouter(prefix="/v3/auth")


@router.get("/me")
def me(request: Request):
    user_id = require_user(request)
    with engine.begin() as conn:
        row = conn.execute(
            select(users.c.username, textql_tokens.c.expires_at, textql_tokens.c.updated_at)
            .select_from(users.outerjoin(textql_tokens))
            .where(users.c.id == user_id)
        ).one()
    return {
        "username": row.username,
        "textql": {
            "server_url": server_url(),
            "connected": row.expires_at is not None,
            "access_token_expires_at": row.expires_at,
            "last_refreshed_at": row.updated_at,
        },
    }


@router.get("/textql/connect")
def textql_connect(request: Request):
    require_user(request)
    client_id, _ = _client_credentials()
    req = authorization_url(client_id, REDIRECT_URI, scopes=SCOPES, server_url=server_url())
    with engine.begin() as conn:
        conn.execute(
            update(sessions)
            .where(sessions.c.id == request.cookies.get(SESSION_COOKIE))
            .values(oauth_state=req.state, oauth_verifier=req.code_verifier)
        )
    return RedirectResponse(req.url)


def _take_oauth_login(request: Request) -> Optional[Row]:
    """This session's pending state and verifier, cleared so they can't be replayed."""
    session_id = request.cookies.get(SESSION_COOKIE)
    with engine.begin() as conn:
        login = conn.execute(
            select(sessions.c.oauth_state, sessions.c.oauth_verifier).where(sessions.c.id == session_id)
        ).first()
        conn.execute(
            update(sessions).where(sessions.c.id == session_id).values(oauth_state=None, oauth_verifier=None)
        )
    return login


async def textql_callback(request: Request):
    """Mounted at the path of REDIRECT_URI (main.py)."""
    user_id = require_user(request)
    login = _take_oauth_login(request)
    params = request.query_params
    if params.get("error"):
        return RedirectResponse(f"/?textql_error={params['error']}")
    code, state = params.get("code"), params.get("state") or ""
    if not code or login is None or not login.oauth_state or not hmac.compare_digest(login.oauth_state, state):
        return RedirectResponse("/?textql_error=state_mismatch")

    client_id, client_secret = _client_credentials()
    try:
        tokens = await run_in_threadpool(
            exchange_code,
            code,
            client_id=client_id,
            client_secret=client_secret,
            redirect_uri=REDIRECT_URI,
            code_verifier=login.oauth_verifier,
            server_url=server_url(),
        )
    except OAuthRefreshError as e:
        logger.warning("TextQL code exchange failed: %s", e)
        return RedirectResponse(f"/?textql_error={e.error}")

    with engine.begin() as conn:
        _save_tokens(conn, user_id, tokens)
    _drop_clients(user_id)
    return RedirectResponse("/")


@router.post("/textql/disconnect")
async def textql_disconnect(request: Request):
    user_id = require_user(request)
    with engine.begin() as conn:
        refresh_token = conn.scalar(
            delete(textql_tokens).where(textql_tokens.c.user_id == user_id).returning(textql_tokens.c.refresh_token)
        )
    _drop_clients(user_id)
    if refresh_token:
        # Ends the grant on TextQL's side. The access token already issued
        # keeps working until it expires, at most an hour.
        client_id, client_secret = _client_credentials()
        async with httpx.AsyncClient(verify=_ssl_ctx, timeout=10) as client:
            try:
                await client.post(
                    f"{server_url()}/oauth/revoke",
                    data={"token": refresh_token, "client_id": client_id, "client_secret": client_secret},
                )
            except httpx.HTTPError as e:
                logger.warning("TextQL revoke failed: %s", e)
    return {"ok": True}
