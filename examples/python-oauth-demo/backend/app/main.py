"""FastAPI app for the TextQL OAuth example.

Same chat backend as the python-react-demo, but instead of one org API key every
/v3/textql request runs as the signed-in user's TextQL member:

    app/db.py           the SQLite file and its tables
    app/users.py        the app's own accounts and session cookie
    app/textql_oauth.py connecting each user to TextQL, and acting as them
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

from app import db, textql_oauth, textql_router, users  # noqa: E402

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
    logger.info("ready | server_url=%s db=%s", textql_oauth.server_url(), db.DB_PATH)
    try:
        yield
    finally:
        textql_router._http = None
        await preview_client.aclose()
        await textql_oauth.close_all()
        db.engine.dispose()


app = FastAPI(title="TextQL OAuth Example", lifespan=lifespan)

app.include_router(users.router)
app.include_router(textql_oauth.router)
app.include_router(textql_router.router, dependencies=[Depends(textql_oauth.bind_textql)])
app.add_api_route(urlparse(textql_oauth.REDIRECT_URI).path, textql_oauth.textql_callback, methods=["GET"])


@app.get("/health")
async def health():
    return {"status": "ok"}
