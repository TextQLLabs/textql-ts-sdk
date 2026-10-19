"""Signing users in with an OIDC identity provider that TextQL also trusts.

    GET  /v3/auth/config  the IdP's display name, for the sign-in button
    GET  /v3/auth/login   302 to the IdP (authorization code + PKCE)
    GET  /callback        code -> IdP tokens -> users + idp_tokens rows, sid cookie
    POST /v3/auth/logout  drop the session

Nothing here is specific to one IdP: endpoints come from the issuer's discovery
document. There are no passwords: the IdP's `sub` is the user. The access token
it returns is what textql_federation.py exchanges for TextQL access, so
IDP_ISSUER must be an authorization server whose access tokens third parties can
verify (in Okta, a custom one such as `/oauth2/default`, not the org server).
"""

import base64
import hashlib
import hmac
import json
import os
import secrets
import ssl
import time
from functools import cache
from typing import Any, Optional
from urllib.parse import urlencode

import httpx
import truststore
from fastapi import APIRouter, HTTPException, Request, Response
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import RedirectResponse
from sqlalchemy import Connection, delete, select
from sqlalchemy.dialects.sqlite import insert

from app.db import engine, idp_tokens, pending_logins, sessions, textql_tokens, users

SESSION_COOKIE = "sid"
STATE_COOKIE = "idp_state"
# Register exactly this on the IdP app. Vite proxies it to the backend.
REDIRECT_URI = os.environ.get("IDP_REDIRECT_URI", "http://localhost:5175/callback")
IDP_NAME = os.environ.get("IDP_NAME") or "SSO"
# offline_access gets a refresh token, so a new access token (and with it a new
# TextQL token) needs no trip back through the browser.
SCOPES = os.environ.get("IDP_SCOPES", "openid profile email offline_access")
PENDING_LOGIN_TTL = 600

router = APIRouter(prefix="/v3/auth")

_http = httpx.Client(verify=truststore.SSLContext(ssl.PROTOCOL_TLS_CLIENT), timeout=15)


class IdpError(Exception):
    def __init__(self, error: str, description: Optional[str] = None) -> None:
        self.error = error
        self.description = description
        super().__init__(f"{error}: {description}" if description else error)


def issuer() -> str:
    value = os.getenv("IDP_ISSUER")
    if not value:
        raise RuntimeError("IDP_ISSUER must be set; copy .env.example to .env")
    return value.rstrip("/")


def _client() -> tuple[str, str]:
    client_id, client_secret = os.getenv("IDP_CLIENT_ID"), os.getenv("IDP_CLIENT_SECRET")
    if not client_id or not client_secret:
        raise RuntimeError("IDP_CLIENT_ID and IDP_CLIENT_SECRET must be set; copy .env.example to .env")
    return client_id, client_secret


@cache
def _discovery() -> dict[str, Any]:
    response = _http.get(f"{issuer()}/.well-known/openid-configuration")
    response.raise_for_status()
    return response.json()


def id_token_claims(id_token: str) -> dict[str, Any]:
    # Read without verifying: it came straight from the IdP's token endpoint over
    # TLS. TextQL checks the signature when the token is exchanged.
    payload = id_token.split(".")[1]
    return json.loads(base64.urlsafe_b64decode(payload + "=" * (-len(payload) % 4)))


def _token_request(data: dict[str, str]) -> dict[str, Any]:
    response = _http.post(_discovery()["token_endpoint"], data=data, auth=_client())
    try:
        body = response.json()
    except ValueError:  # an HTML error page from a proxy or an outage
        body = {}
    if response.status_code != 200 or "id_token" not in body or "access_token" not in body:
        raise IdpError(body.get("error", f"http_{response.status_code}"), body.get("error_description"))
    return body


def save_idp_tokens(conn: Connection, user_id: int, body: dict[str, Any], keep_refresh: Optional[str] = None) -> str:
    """Store what the IdP's token endpoint returned and hand back the access token."""
    values = {
        "id_token": body["id_token"],
        # Most IdPs return a new refresh token only when rotation is on.
        "refresh_token": body.get("refresh_token") or keep_refresh,
        "id_token_expires_at": float(id_token_claims(body["id_token"])["exp"]),
        "access_token": body["access_token"],
        "access_token_expires_at": time.time() + float(body.get("expires_in", 3600)),
        "updated_at": time.time(),
    }
    conn.execute(
        insert(idp_tokens)
        .values(user_id=user_id, **values)
        .on_conflict_do_update(index_elements=[idp_tokens.c.user_id], set_=values)
    )
    return body["access_token"]


def refresh_idp(conn: Connection, user_id: int, refresh_token: str) -> str:
    """A new access token from the IdP for this user, saved inside `conn`."""
    body = _token_request({"grant_type": "refresh_token", "refresh_token": refresh_token, "scope": SCOPES})
    return save_idp_tokens(conn, user_id, body, keep_refresh=refresh_token)


def end_sessions(conn: Connection, user_id: int) -> None:
    """Sign the user out everywhere and forget every token held for them."""
    conn.execute(delete(sessions).where(sessions.c.user_id == user_id))
    conn.execute(delete(idp_tokens).where(idp_tokens.c.user_id == user_id))
    conn.execute(delete(textql_tokens).where(textql_tokens.c.user_id == user_id))


def require_user(request: Request) -> int:
    session_id = request.cookies.get(SESSION_COOKIE)
    if session_id:
        with engine.begin() as conn:
            user_id = conn.scalar(select(sessions.c.user_id).where(sessions.c.id == session_id))
        if user_id is not None:
            return user_id
    raise HTTPException(401, "not_signed_in")


def _pkce_challenge(verifier: str) -> str:
    return base64.urlsafe_b64encode(hashlib.sha256(verifier.encode()).digest()).rstrip(b"=").decode()


@router.get("/config")
def config():
    """What the sign-in screen shows before anyone is signed in."""
    return {"idp_name": IDP_NAME}


@router.get("/login")
def login():
    client_id, _ = _client()
    state, verifier, nonce = secrets.token_urlsafe(24), secrets.token_urlsafe(64), secrets.token_urlsafe(24)
    now = time.time()
    with engine.begin() as conn:
        conn.execute(delete(pending_logins).where(pending_logins.c.created_at < now - PENDING_LOGIN_TTL))
        conn.execute(
            insert(pending_logins).values(state=state, code_verifier=verifier, nonce=nonce, created_at=now)
        )
    params = {
        "response_type": "code",
        "client_id": client_id,
        "redirect_uri": REDIRECT_URI,
        "scope": SCOPES,
        "state": state,
        "nonce": nonce,
        "code_challenge": _pkce_challenge(verifier),
        "code_challenge_method": "S256",
    }
    response = RedirectResponse(f"{_discovery()['authorization_endpoint']}?{urlencode(params)}")
    # Ties the callback to the browser that started the sign-in.
    response.set_cookie(STATE_COOKIE, state, max_age=PENDING_LOGIN_TTL, httponly=True, samesite="lax")
    return response


def _finish_login(code: str, state: str) -> int:
    with engine.begin() as conn:
        pending = conn.execute(
            delete(pending_logins)
            .where(pending_logins.c.state == state)
            .returning(pending_logins.c.code_verifier, pending_logins.c.nonce, pending_logins.c.created_at)
        ).first()
    if pending is None or pending.created_at < time.time() - PENDING_LOGIN_TTL:
        raise IdpError("state_mismatch")

    body = _token_request({
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": REDIRECT_URI,
        "code_verifier": pending.code_verifier,
    })
    claims = id_token_claims(body["id_token"])
    if not hmac.compare_digest(str(claims.get("nonce", "")).encode(), pending.nonce.encode()):
        raise IdpError("nonce_mismatch")

    with engine.begin() as conn:
        profile = {"email": claims.get("email"), "name": claims.get("name")}
        user_id = conn.scalar(
            insert(users)
            .values(idp_sub=claims["sub"], created_at=time.time(), **profile)
            .on_conflict_do_update(index_elements=[users.c.idp_sub], set_=profile)
            .returning(users.c.id)
        )
        assert user_id is not None
        save_idp_tokens(conn, user_id, body)
    return user_id


async def idp_callback(request: Request):
    """Mounted at the path of REDIRECT_URI (main.py)."""
    params = request.query_params
    if params.get("error"):
        return RedirectResponse(f"/?{urlencode({'login_error': params.get('error_description') or params['error']})}")
    code, state = params.get("code"), params.get("state") or ""
    if not code or not hmac.compare_digest(request.cookies.get(STATE_COOKIE, "").encode(), state.encode()):
        return RedirectResponse("/?login_error=state_mismatch")
    try:
        user_id = await run_in_threadpool(_finish_login, code, state)
    except IdpError as e:
        return RedirectResponse(f"/?{urlencode({'login_error': e.description or e.error})}")

    session_id = secrets.token_urlsafe(32)
    with engine.begin() as conn:
        conn.execute(insert(sessions).values(id=session_id, user_id=user_id, created_at=time.time()))
    response = RedirectResponse("/")
    response.delete_cookie(STATE_COOKIE)
    # Add secure=True when serving over HTTPS.
    response.set_cookie(SESSION_COOKIE, session_id, httponly=True, samesite="lax")
    return response


@router.post("/logout")
def logout(request: Request, response: Response):
    with engine.begin() as conn:
        conn.execute(delete(sessions).where(sessions.c.id == request.cookies.get(SESSION_COOKIE)))
    response.delete_cookie(SESSION_COOKIE)
    return {"ok": True}
