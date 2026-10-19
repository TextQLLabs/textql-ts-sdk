"""FastAPI app for the TextQL identity provider federation example.

Same chat backend as the python-react-demo, but instead of one org API key every
/v3/textql request runs as the signed-in user's TextQL member, found from the
identity provider sign-in they already did:

    app/db.py                the SQLite file and its tables
    app/idp_login.py         signing in with the IdP, and the session cookie
    app/textql_federation.py exchanging each user's IdP ID token for TextQL access
"""

import logging
import ssl
from contextlib import asynccontextmanager
from pathlib import Path
from urllib.parse import urlparse

import httpx
import truststore
from dotenv import load_dotenv
from fastapi import Depends, FastAPI

load_dotenv(Path(__file__).resolve().parents[2] / ".env")

from app import db, idp_login, textql_federation, textql_router  # noqa: E402

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)-7s %(name)s  %(message)s",
)
logger = logging.getLogger("demo")


@asynccontextmanager
async def lifespan(_app: FastAPI):
    db.init()
    ctx = truststore.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
    # Shared across users: the preview proxy fetches signed asset URLs that
    # need no TextQL credentials.
    preview_client = httpx.AsyncClient(follow_redirects=True, timeout=30.0, verify=ctx)
    textql_router._http = preview_client
    logger.info(
        "ready | server_url=%s org_id=%s idp=%s db=%s",
        textql_federation.server_url(), textql_federation.org_id(), idp_login.issuer(), db.DB_PATH,
    )
    try:
        yield
    finally:
        textql_router._http = None
        await preview_client.aclose()
        await textql_federation.close_all()
        db.engine.dispose()


app = FastAPI(title="TextQL IdP Federation Example", lifespan=lifespan)

app.include_router(idp_login.router)
app.include_router(textql_federation.router)
app.include_router(textql_router.router, dependencies=[Depends(textql_federation.bind_textql)])
app.add_api_route(urlparse(idp_login.REDIRECT_URI).path, idp_login.idp_callback, methods=["GET"])


@app.get("/health")
async def health():
    return {"status": "ok"}
