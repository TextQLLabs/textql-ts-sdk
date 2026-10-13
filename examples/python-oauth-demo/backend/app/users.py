"""The example app's own accounts: username + password, and a session cookie.

Nothing TextQL-specific here; swap in your real user system. The only thing
the OAuth side needs from it is `require_user(request) -> user_id`.
"""

import hashlib
import hmac
import secrets
import time

from fastapi import APIRouter, HTTPException, Request, Response
from pydantic import BaseModel
from sqlalchemy import delete, insert, select
from sqlalchemy.exc import IntegrityError

from app.db import engine, sessions, users

SESSION_COOKIE = "sid"

router = APIRouter(prefix="/v3/auth")


def _hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.scrypt(password.encode(), salt=salt, n=2**14, r=8, p=1)
    return f"{salt.hex()}${digest.hex()}"


def _check_password(password: str, stored: str) -> bool:
    salt, digest = stored.split("$")
    candidate = hashlib.scrypt(password.encode(), salt=bytes.fromhex(salt), n=2**14, r=8, p=1)
    return hmac.compare_digest(candidate.hex(), digest)


def _start_session(response: Response, user_id: int) -> None:
    session_id = secrets.token_urlsafe(32)
    with engine.begin() as conn:
        conn.execute(insert(sessions).values(id=session_id, user_id=user_id, created_at=time.time()))
    # Add secure=True when serving over HTTPS.
    response.set_cookie(SESSION_COOKIE, session_id, httponly=True, samesite="lax")


def require_user(request: Request) -> int:
    session_id = request.cookies.get(SESSION_COOKIE)
    if session_id:
        with engine.begin() as conn:
            user_id = conn.scalar(select(sessions.c.user_id).where(sessions.c.id == session_id))
        if user_id is not None:
            return user_id
    raise HTTPException(401, "not_signed_in")


class Credentials(BaseModel):
    username: str
    password: str


@router.post("/signup")
def signup(body: Credentials, response: Response):
    username = body.username.strip()
    if len(username) < 2 or len(body.password) < 8:
        raise HTTPException(400, "Use a username of 2+ characters and a password of 8+.")
    try:
        with engine.begin() as conn:
            user_id = conn.scalar(
                insert(users)
                .values(username=username, password_hash=_hash_password(body.password), created_at=time.time())
                .returning(users.c.id)
            )
    except IntegrityError:
        raise HTTPException(409, "That username is taken.")
    assert user_id is not None
    _start_session(response, user_id)
    return {"ok": True}


@router.post("/login")
def login(body: Credentials, response: Response):
    with engine.begin() as conn:
        user = conn.execute(
            select(users.c.id, users.c.password_hash).where(users.c.username == body.username.strip())
        ).first()
    if user is None or not _check_password(body.password, user.password_hash):
        raise HTTPException(401, "Wrong username or password.")
    _start_session(response, user.id)
    return {"ok": True}


@router.post("/logout")
def logout(request: Request, response: Response):
    with engine.begin() as conn:
        conn.execute(delete(sessions).where(sessions.c.id == request.cookies.get(SESSION_COOKIE)))
    response.delete_cookie(SESSION_COOKIE)
    return {"ok": True}
