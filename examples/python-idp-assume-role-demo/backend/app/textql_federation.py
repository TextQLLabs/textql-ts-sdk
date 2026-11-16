"""Acting as each user on TextQL, scoped to one role.

    exchange_token(access_token, org_id=...)  -> a TextQL access token for the user's member
    rbac.who_am_i()                           -> which member that is (asked with that token)
    rbac.create_api_key(target_member_id=..., assumed_roles=roles)
                                              -> a two-hour API key for that member, limited to those roles

That key is what "Assume Roles" in the TextQL app makes: a short-lived API key
scoped to the chosen roles, sent instead of the session. The app mints it with
the browser session. An exchanged token is an OAuth token, and TextQL does not
let OAuth tokens create API keys, so here a minter API key holding
api_access_key:delegate mints it for the member the exchange found.

Every /v3/textql request goes through `bind_textql`, which loads the user's
role key, mints a new one if it is about to expire (exchanging again first, so
the IdP still has to vouch for the user), and binds a TextQL client built from it.
"""

import json
import logging
import os
import ssl
import threading
import time
from contextvars import ContextVar
from dataclasses import dataclass
from datetime import datetime, timezone
from functools import cache
from typing import Any, Optional

import httpx
import truststore
from fastapi import APIRouter, HTTPException, Request, Response
from fastapi.concurrency import run_in_threadpool
from sqlalchemy import Row, delete, func, select
from sqlalchemy.dialects.sqlite import insert

from textql_sdk import Textql
from textql_sdk._connect.public.connector_connect import ConnectorServiceClient
from textql_sdk.errors import TextqlDefaultError
from textql_sdk.models import ConnectError
from textql_sdk.oauth import ACCESS_TOKEN_TYPE, OAuthRefreshError, OAuthTokens, TokenAuth, TokenManager, exchange_token
from textql_sdk.streaming import create_connect_client, create_streaming_client

from app import idp_login
from app.db import engine, idp_tokens, sessions, textql_role_keys, users
from app.idp_login import SESSION_COOKIE, IdpError, require_user

logger = logging.getLogger(__name__)

# Refresh the IdP access token before exchanging when less than this is left,
# so the TextQL token it buys is worth having.
SUBJECT_TOKEN_MIN_REMAINING = 300
# How long a role key lasts: the length of an Assume Roles session in the TextQL
# app. Shorter means a user removed at the IdP loses TextQL access sooner.
ROLE_KEY_TTL = 2 * 60 * 60
# Mint a new key when less than this is left on the current one.
ROLE_KEY_MIN_REMAINING = 60


def server_url() -> str:
    return (os.getenv("TEXTQL_SERVER_URL") or "https://app.textql.com").rstrip("/")


def org_id() -> str:
    value = os.getenv("TEXTQL_ORG_ID")
    if not value:
        raise RuntimeError("TEXTQL_ORG_ID must be set; copy .env.example to .env")
    return value


def assume_role_ids() -> list[str]:
    """The TextQL roles every signed-in user is scoped to. They must already hold each one."""
    ids = sorted({part.strip() for part in os.getenv("TEXTQL_ASSUME_ROLE_IDS", "").split(",") if part.strip()})
    if not ids:
        raise RuntimeError("TEXTQL_ASSUME_ROLE_IDS must be set; copy .env.example to .env")
    return ids


_ssl_ctx = truststore.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
_textql_http = httpx.Client(verify=_ssl_ctx, timeout=30)


@cache
def minter() -> Textql:
    """The SDK as the minter: a service account whose role holds api_access_key:delegate."""
    api_key = os.getenv("TEXTQL_MINTER_API_KEY")
    if not api_key:
        raise RuntimeError("TEXTQL_MINTER_API_KEY must be set; copy .env.example to .env")
    return Textql(api_key=api_key, server_url=server_url(), client=_textql_http)


class SignedOut(HTTPException):
    """The IdP will not issue this user a new access token; they must sign in again."""

    def __init__(self) -> None:
        super().__init__(401, "not_signed_in")


class ExchangeFailed(HTTPException):
    """409: TextQL refused the exchange or the role; 503: TextQL or the IdP is unavailable."""

    def __init__(self, status: int, error: str, description: Optional[str] = None) -> None:
        super().__init__(status, {"error": error, "description": description})


def _transient(status_code: int) -> bool:
    return status_code == 429 or status_code >= 500


def _refusal(error: str, e: TextqlDefaultError) -> ExchangeFailed:
    """A failed TextQL call as a 409 carrying TextQL's reason, or a 503 to retry."""
    if _transient(e.status_code):
        return ExchangeFailed(503, "textql_unavailable", str(e))
    try:
        body = json.loads(e.body)
    except ValueError:
        body = None
    message = body.get("message") if isinstance(body, dict) else None
    return ExchangeFailed(409, error, message or e.body)


def _subject_token(user_id: int) -> str:
    """A current IdP access token for the user, refreshed with the IdP if needed.

    Runs in its own short transaction under SQLite's write lock: the refresh may
    rotate the IdP refresh token, so concurrent renewals (even from another
    process) re-read the row and never spend the same one twice. The rotated
    token is committed before anything else can fail.
    """
    with engine.begin() as conn:  # BEGIN IMMEDIATE, see db.py
        row = conn.execute(select(idp_tokens).where(idp_tokens.c.user_id == user_id)).first()
        if row is not None and row.access_token_expires_at - time.time() > SUBJECT_TOKEN_MIN_REMAINING:
            return row.access_token
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


def _exchange(user_id: int) -> OAuthTokens:
    """Exchange a current IdP access token for a TextQL access token as the user's member."""
    subject_token = _subject_token(user_id)
    try:
        return exchange_token(
            subject_token,
            org_id=org_id(),
            subject_token_type=ACCESS_TOKEN_TYPE,
            server_url=server_url(),
            http_client=_textql_http,
        )
    except OAuthRefreshError as e:
        if _transient(e.status_code):
            raise ExchangeFailed(503, e.error, e.description) from e
        logger.info("TextQL refused the exchange for user %s: %s", user_id, e)
        raise ExchangeFailed(409, e.error, e.description) from e
    except httpx.HTTPError as e:
        raise ExchangeFailed(503, "textql_unavailable", str(e)) from e


def _member_id(tokens: OAuthTokens) -> str:
    """The TextQL member the exchanged token acts as, asked of TextQL with that token.

    This is the only thing the token is used for. Asking TextQL, rather than
    matching the IdP email, means the key is minted for whoever TextQL verified.
    """
    manager = TokenManager(tokens.access_token, expires_at=tokens.expires_at)
    try:
        with httpx.Client(auth=TokenAuth(manager), verify=_ssl_ctx, timeout=30) as http:
            who = Textql(server_url=server_url(), client=http).rbac.who_am_i(body={})
    except TextqlDefaultError as e:
        raise _refusal("whoami_failed", e) from e
    except httpx.HTTPError as e:
        raise ExchangeFailed(503, "textql_unavailable", str(e)) from e
    if isinstance(who, ConnectError) or not who.member_id:
        raise ExchangeFailed(409, "whoami_failed", "TextQL did not say which member the token is for")
    return who.member_id


def _mint_role_key(member_id: str) -> dict[str, Any]:
    """A ROLE_KEY_TTL API key that acts as the member with only the assumed roles.

    TextQL refuses unless the member already holds every role: assuming narrows
    what they can do, it never adds to it. Objects shared with the member
    directly stay visible; ones shared with their other roles do not.

    The roles are always listed, never inherit_all_roles: a delegate minter may
    mint for any member, admins included, and listing them keeps every key to
    these roles whoever signs in.
    """
    role_ids = assume_role_ids()
    try:
        result = minter().rbac.create_api_key(
            target_member_id=member_id,
            assumed_roles=role_ids,
            expiry_seconds=ROLE_KEY_TTL,
            name=f"IdP demo assumed role ({datetime.now(timezone.utc).isoformat(timespec='seconds')})",
        )
    except TextqlDefaultError as e:
        raise _refusal("assume_role_refused", e) from e
    except httpx.HTTPError as e:
        raise ExchangeFailed(503, "textql_unavailable", str(e)) from e
    if isinstance(result, ConnectError) or result.api_key is None or not result.api_key.id or not result.api_key_secret:
        raise ExchangeFailed(409, "assume_role_refused", "TextQL returned no API key")
    key = result.api_key
    return {
        "api_key_id": key.id,
        "api_key": result.api_key_secret,
        "role_ids": json.dumps(role_ids),
        "role_names": json.dumps(list(key.assumed_role_names or [])),
        "expires_at": key.expires_at.timestamp() if key.expires_at else time.time() + ROLE_KEY_TTL,
        "updated_at": time.time(),
    }


def _key_row(user_id: int) -> Optional[Row[Any]]:
    with engine.begin() as conn:
        return conn.execute(select(textql_role_keys).where(textql_role_keys.c.user_id == user_id)).first()


def _stale(key: Row[Any]) -> bool:
    return json.loads(key.role_ids) != assume_role_ids() or key.expires_at - time.time() < ROLE_KEY_MIN_REMAINING


_assume_locks: dict[int, threading.Lock] = {}


def _assume(user_id: int) -> str:
    """The user's role key, minted now unless they hold one that is still good.

    Every key comes from here: the first after sign-in and each replacement
    before one expires. One at a time per user in this process, so a page that
    fires several requests at once mints once. A replaced key is left to
    expire: it has under a minute left and a request may still be using it.
    """
    with _clients_lock:
        lock = _assume_locks.setdefault(user_id, threading.Lock())
    with lock:
        key = _key_row(user_id)
        if key is not None and not _stale(key):
            return key.api_key
        try:
            values = _mint_role_key(_member_id(_exchange(user_id)))
        except ExchangeFailed as e:
            if e.status_code == 409:
                # A real refusal (not a member, role not assigned, ...): forget the
                # key so the UI goes back to the connect screen and shows why.
                with engine.begin() as conn:
                    conn.execute(delete(textql_role_keys).where(textql_role_keys.c.user_id == user_id))
                _drop_clients(user_id)
            raise
        with engine.begin() as conn:
            conn.execute(
                insert(textql_role_keys)
                .values(user_id=user_id, **values)
                .on_conflict_do_update(index_elements=[textql_role_keys.c.user_id], set_=values)
            )
    return values["api_key"]


def _revoke(key: Row[Any]) -> None:
    """Revoke a role key at sign-out, as the app does when an Assume Roles session ends.

    The key revokes itself: its owner is the user, and the minter may only
    revoke its own keys. Best effort; a key that survives this still expires.
    """
    if key.expires_at <= time.time():
        return
    try:
        sdk = Textql(api_key=key.api_key, server_url=server_url(), client=_textql_http)
        sdk.rbac.revoke_api_key(api_key_id=key.api_key_id)
    except (TextqlDefaultError, httpx.HTTPError) as e:
        logger.warning("could not revoke TextQL key %s: %s", key.api_key_id, e)


# --- Per-user TextQL clients ---------------------------------------------------

@dataclass
class UserClients:
    api_key: str
    sdk: Textql
    streaming: Any
    connectors: Any
    http: httpx.AsyncClient


_clients: dict[int, UserClients] = {}
_clients_lock = threading.Lock()
_current: ContextVar[Optional[UserClients]] = ContextVar("textql_user_clients", default=None)


def _build_clients(api_key: str) -> UserClients:
    http = httpx.AsyncClient(
        follow_redirects=True,
        timeout=httpx.Timeout(None, connect=10.0),
        verify=_ssl_ctx,
    )
    sdk = Textql(api_key=api_key, server_url=server_url(), async_client=http)
    return UserClients(
        api_key=api_key,
        sdk=sdk,
        streaming=create_streaming_client(sdk),
        connectors=create_connect_client(ConnectorServiceClient, sdk),
        http=http,
    )


def _clients_for(user_id: int) -> UserClients:
    """This user's clients, built from a role key good for at least a minute.

    Minting a replacement, if due, raises SignedOut or ExchangeFailed for the
    UI to act on.
    """
    key = _key_row(user_id)
    if key is None:
        raise ExchangeFailed(409, "textql_not_connected")
    api_key = _assume(user_id) if _stale(key) else key.api_key
    with _clients_lock:
        clients = _clients.get(user_id)
        # Another process may have minted a new key since these were built.
        if clients is None or clients.api_key != api_key:
            clients = _build_clients(api_key)
            _clients[user_id] = clients
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
                idp_tokens.c.access_token_expires_at,
                textql_role_keys.c.role_ids,
                textql_role_keys.c.role_names,
                textql_role_keys.c.expires_at,
                textql_role_keys.c.updated_at,
            )
            .select_from(users.outerjoin(idp_tokens).outerjoin(textql_role_keys))
            .where(users.c.id == user_id)
        ).one()
    # A key for roles this app no longer assumes sends the user back through the gate.
    connected = row.role_ids is not None and json.loads(row.role_ids) == assume_role_ids()
    return {
        "email": row.email,
        "name": row.name,
        "idp": {
            "name": idp_login.IDP_NAME,
            "issuer": idp_login.issuer(),
            "access_token_expires_at": row.access_token_expires_at,
            "can_refresh": row.refresh_token is not None,
        },
        "textql": {
            "server_url": server_url(),
            "org_id": org_id(),
            "connected": connected,
            "assumed_roles": json.loads(row.role_names) if connected else [],
            "key_expires_at": row.expires_at if connected else None,
            "last_assumed_at": row.updated_at if connected else None,
        },
    }

@router.post("/textql/exchange")
async def textql_exchange(request: Request):
    """Exchange and assume the role now; the gate calls this after sign-in."""
    user_id = await run_in_threadpool(require_user, request)
    await run_in_threadpool(_assume, user_id)
    return {"ok": True}


@router.post("/logout")
def logout(request: Request, response: Response):
    """End this browser's session; when it was the user's last, revoke their role key."""
    with engine.begin() as conn:
        user_id = conn.scalar(
            delete(sessions).where(sessions.c.id == request.cookies.get(SESSION_COOKIE)).returning(sessions.c.user_id)
        )
        key = None
        if user_id is not None and not conn.scalar(
            select(func.count()).select_from(sessions).where(sessions.c.user_id == user_id)
        ):
            key = conn.execute(
                delete(textql_role_keys).where(textql_role_keys.c.user_id == user_id).returning(textql_role_keys)
            ).first()
    if user_id is not None and key is not None:
        _drop_clients(user_id)
        _revoke(key)
    response.delete_cookie(SESSION_COOKIE)
    return {"ok": True}
