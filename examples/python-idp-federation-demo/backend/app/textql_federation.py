"""Acting as each user on TextQL by exchanging their IdP ID token.

    exchange_token(id_token, org_id=...)  -> a TextQL access token for the member
                                             that IdP identity signed in as

There is no TextQL login and no TextQL refresh token. The access token lasts
no longer than the ID token it came from, so when it runs out the user's
TokenManager calls `renew`: refresh the ID token with the IdP if needed, then
exchange again.

Every /v3/textql request goes through `bind_textql`, which loads the user's
token, renews it if needed, and binds a TextQL client built from it.
"""

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
from sqlalchemy import Connection, Row, delete, select
from sqlalchemy.dialects.sqlite import insert

from textql_sdk import Textql
from textql_sdk._connect.public.connector_connect import ConnectorServiceClient
from textql_sdk.oauth import OAuthRefreshError, OAuthTokens, TokenAuth, TokenManager, exchange_token
from textql_sdk.streaming import create_connect_client, create_streaming_client

from app import idp_login
from app.db import engine, idp_tokens, textql_tokens, users
from app.idp_login import IdpError, require_user

logger = logging.getLogger(__name__)

# Refresh the ID token before exchanging when less than this is left, so the
# TextQL token it buys is worth having.
ID_TOKEN_MIN_REMAINING = 300


def server_url() -> str:
    return (os.getenv("TEXTQL_SERVER_URL") or "https://app.textql.com").rstrip("/")


def org_id() -> str:
    value = os.getenv("TEXTQL_ORG_ID")
    if not value:
        raise RuntimeError("TEXTQL_ORG_ID must be set; copy .env.example to .env")
    return value


_ssl_ctx = truststore.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
_exchange_http = httpx.Client(verify=_ssl_ctx, timeout=30)


class SignedOut(Exception):
    """The IdP will not issue this user a new ID token; they must sign in again."""


def _id_token(conn: Connection, user_id: int) -> str:
    row = conn.execute(select(idp_tokens).where(idp_tokens.c.user_id == user_id)).first()
    if row is None:
        raise SignedOut()
    if row.id_token_expires_at - time.time() > ID_TOKEN_MIN_REMAINING:
        return row.id_token
    if not row.refresh_token:
        raise SignedOut()
    try:
        return idp_login.refresh_idp(conn, user_id, row.refresh_token)
    except IdpError as e:
        logger.info("IdP refresh for user %s failed (%s); asking them to sign in again", user_id, e)
        raise SignedOut() from e


def _exchange(conn: Connection, user_id: int) -> OAuthTokens:
    return exchange_token(
        _id_token(conn, user_id),
        org_id=org_id(),
        server_url=server_url(),
        http_client=_exchange_http,
    )


def _save_tokens(conn: Connection, user_id: int, t: OAuthTokens) -> None:
    values = {
        "access_token": t.access_token,
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
    # The connection holding the write lock while this user's renewal runs, so
    # renew and on_tokens write inside that transaction instead of waiting on it.
    locked_conn: dict = field(default_factory=lambda: {"conn": None})


_clients: dict[int, UserClients] = {}
_clients_lock = threading.Lock()
_current: ContextVar[Optional[UserClients]] = ContextVar("textql_user_clients", default=None)


def _build_clients(user_id: int, row: Row) -> UserClients:
    locked_conn: dict = {"conn": None}

    def in_tx(fn):
        conn = locked_conn["conn"]
        if conn is not None:
            return fn(conn)
        # A renewal after a 401 mid-request, outside the request-start lock.
        with engine.begin() as conn:
            return fn(conn)

    manager = TokenManager(
        row.access_token,
        expires_at=row.expires_at,
        renew=lambda: in_tx(lambda conn: _exchange(conn, user_id)),
        on_tokens=lambda t: in_tx(lambda conn: _save_tokens(conn, user_id, t)),
        server_url=server_url(),
    )
    http = httpx.AsyncClient(
        auth=TokenAuth(manager),
        follow_redirects=True,
        timeout=httpx.Timeout(None, connect=10.0),
        verify=_ssl_ctx,
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


class ExchangeRefused(HTTPException):
    def __init__(self, e: Optional[OAuthRefreshError] = None) -> None:
        detail = {"error": e.error, "description": e.description} if e else {"error": "textql_not_connected"}
        super().__init__(409, detail)


def _clients_for(user_id: int) -> UserClients:
    """This user's clients with an access token good for at least a minute.

    Renewal may spend the user's IdP refresh token, so the check-and-renew runs
    under SQLite's write lock (`BEGIN IMMEDIATE`): concurrent requests, even from
    another process, never renew the same user at once.
    """
    refused: Optional[OAuthRefreshError] = None
    signed_out = False
    with engine.begin() as conn:  # BEGIN IMMEDIATE, see db.py
        row = conn.execute(select(textql_tokens).where(textql_tokens.c.user_id == user_id)).first()
        if row is not None:
            with _clients_lock:
                clients = _clients.get(user_id)
                if clients is None or clients.manager.tokens.access_token != row.access_token:
                    clients = _build_clients(user_id, row)
                    _clients[user_id] = clients

            clients.locked_conn["conn"] = conn
            try:
                clients.manager.access_token()
                return clients
            except OAuthRefreshError as e:
                if e.error != "invalid_grant":
                    raise
                logger.info("TextQL refused the exchange for user %s: %s", user_id, e)
                refused = e
                conn.execute(delete(textql_tokens).where(textql_tokens.c.user_id == user_id))
            except SignedOut:
                signed_out = True
                conn.execute(delete(textql_tokens).where(textql_tokens.c.user_id == user_id))
                idp_login.end_sessions(conn, user_id)
            finally:
                clients.locked_conn["conn"] = None
    _drop_clients(user_id)
    if signed_out:
        raise HTTPException(401, "not_signed_in")
    raise ExchangeRefused(refused)


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
            select(
                users.c.email,
                users.c.name,
                idp_tokens.c.refresh_token,
                idp_tokens.c.id_token_expires_at,
                textql_tokens.c.expires_at,
                textql_tokens.c.updated_at,
            )
            .select_from(users.outerjoin(idp_tokens).outerjoin(textql_tokens))
            .where(users.c.id == user_id)
        ).one()
    return {
        "email": row.email,
        "name": row.name,
        "idp": {
            "name": idp_login.IDP_NAME,
            "issuer": idp_login.issuer(),
            "id_token_expires_at": row.id_token_expires_at,
            "can_refresh": row.refresh_token is not None,
        },
        "textql": {
            "server_url": server_url(),
            "org_id": org_id(),
            "connected": row.expires_at is not None,
            "access_token_expires_at": row.expires_at,
            "last_exchanged_at": row.updated_at,
        },
    }


def _exchange_now(user_id: int) -> None:
    refused: Optional[OAuthRefreshError] = None
    signed_out = False
    with engine.begin() as conn:
        try:
            _save_tokens(conn, user_id, _exchange(conn, user_id))
        except OAuthRefreshError as e:
            refused = e
        except SignedOut:
            signed_out = True
            idp_login.end_sessions(conn, user_id)
    _drop_clients(user_id)
    if signed_out:
        raise HTTPException(401, "not_signed_in")
    if refused is not None:
        logger.info("TextQL refused the exchange for user %s: %s", user_id, refused)
        raise ExchangeRefused(refused)


@router.post("/textql/exchange")
async def textql_exchange(request: Request):
    """Exchange the user's IdP ID token now; the gate calls this after sign-in."""
    user_id = await run_in_threadpool(require_user, request)
    await run_in_threadpool(_exchange_now, user_id)
    return {"ok": True}
