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
from dataclasses import dataclass
from typing import Any, Optional

import httpx
import truststore
from fastapi import APIRouter, HTTPException, Request
from fastapi.concurrency import run_in_threadpool
from sqlalchemy import delete, select
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


class SignedOut(HTTPException):
    """The IdP will not issue this user a new ID token; they must sign in again."""

    def __init__(self) -> None:
        super().__init__(401, "not_signed_in")


class ExchangeFailed(HTTPException):
    """409: TextQL refused the exchange; 503: TextQL or the IdP is unavailable."""

    def __init__(self, status: int, error: str, description: Optional[str] = None) -> None:
        super().__init__(status, {"error": error, "description": description})


def _transient(status_code: int) -> bool:
    return status_code == 429 or status_code >= 500


def _id_token(user_id: int) -> str:
    """A current ID token for the user, refreshed with the IdP if needed.

    Runs in its own short transaction under SQLite's write lock: the refresh may
    rotate the IdP refresh token, so concurrent renewals (even from another
    process) re-read the row and never spend the same one twice. The rotated
    token is committed before anything else can fail.
    """
    with engine.begin() as conn:  # BEGIN IMMEDIATE, see db.py
        row = conn.execute(select(idp_tokens).where(idp_tokens.c.user_id == user_id)).first()
        if row is not None and row.id_token_expires_at - time.time() > ID_TOKEN_MIN_REMAINING:
            return row.id_token
        if row is not None and row.refresh_token:
            try:
                return idp_login.refresh_idp(conn, user_id, row.refresh_token)
            except IdpError as e:
                if e.error != "invalid_grant":
                    # The IdP is down or erroring; keep the refresh token for a retry.
                    raise ExchangeFailed(503, "idp_unavailable", e.description or e.error) from e
                logger.info("IdP refused the refresh for user %s (%s); signing them out", user_id, e)
            except httpx.HTTPError as e:
                raise ExchangeFailed(503, "idp_unavailable", str(e)) from e
        idp_login.end_sessions(conn, user_id)
    _drop_clients(user_id)
    raise SignedOut()


def _renew(user_id: int) -> OAuthTokens:
    """Exchange a current ID token for a new TextQL access token and store it.

    Every renewal goes through here: the first exchange after sign-in, the
    TokenManager's renewal before expiry, and its retry after a 401. The
    exchange holds no database lock; running it twice is harmless.
    """
    id_token = _id_token(user_id)
    try:
        tokens = exchange_token(id_token, org_id=org_id(), server_url=server_url(), http_client=_exchange_http)
    except OAuthRefreshError as e:
        if _transient(e.status_code):
            raise ExchangeFailed(503, e.error, e.description) from e
        # A real refusal (not a member, audience not accepted, ...): forget the
        # TextQL token so the UI goes back to the exchange screen and shows why.
        logger.info("TextQL refused the exchange for user %s: %s", user_id, e)
        with engine.begin() as conn:
            conn.execute(delete(textql_tokens).where(textql_tokens.c.user_id == user_id))
        _drop_clients(user_id)
        raise ExchangeFailed(409, e.error, e.description) from e
    except httpx.HTTPError as e:
        raise ExchangeFailed(503, "textql_unavailable", str(e)) from e

    values = {
        "access_token": tokens.access_token,
        "expires_at": tokens.expires_at or time.time() + 3600,
        "updated_at": time.time(),
    }
    with engine.begin() as conn:
        conn.execute(
            insert(textql_tokens)
            .values(user_id=user_id, **values)
            .on_conflict_do_update(index_elements=[textql_tokens.c.user_id], set_=values)
        )
    return tokens


# --- Per-user TextQL clients ---------------------------------------------------

@dataclass
class UserClients:
    manager: TokenManager
    sdk: Textql
    streaming: Any
    connectors: Any
    http: httpx.AsyncClient


_clients: dict[int, UserClients] = {}
_clients_lock = threading.Lock()
_current: ContextVar[Optional[UserClients]] = ContextVar("textql_user_clients", default=None)


def _build_clients(user_id: int, access_token: str, expires_at: float) -> UserClients:
    manager = TokenManager(access_token, expires_at=expires_at, renew=lambda: _renew(user_id))
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
    )


def _clients_for(user_id: int) -> UserClients:
    """This user's clients with an access token good for at least a minute.

    Renewal, if due, runs in the TokenManager (one at a time per user in this
    process) and raises SignedOut or ExchangeFailed for the UI to act on.
    """
    with engine.begin() as conn:
        row = conn.execute(select(textql_tokens).where(textql_tokens.c.user_id == user_id)).first()
    if row is None:
        raise ExchangeFailed(409, "textql_not_connected")
    with _clients_lock:
        clients = _clients.get(user_id)
        # Another process may have renewed since these were built.
        if clients is None or clients.manager.tokens.access_token != row.access_token:
            clients = _build_clients(user_id, row.access_token, row.expires_at)
            _clients[user_id] = clients
    clients.manager.access_token()
    return clients


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


@router.post("/textql/exchange")
async def textql_exchange(request: Request):
    """Exchange the user's IdP ID token now; the gate calls this after sign-in."""
    user_id = await run_in_threadpool(require_user, request)
    await run_in_threadpool(_renew, user_id)
    _drop_clients(user_id)
    return {"ok": True}
