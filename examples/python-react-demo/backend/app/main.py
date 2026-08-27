"""FastAPI app for the TextQL streaming demo.

The lifespan builds the two clients the router needs — the REST SDK for unary
calls and the Connect-RPC bridge for `watch_chat` — and injects them into the
router module. There is no per-request client: both are cheap to hold open and
the streaming bridge keeps its own connection pool.
"""

import logging
import os
import ssl

from contextlib import asynccontextmanager

import httpx
import truststore
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from textql_sdk import Textql
from textql_sdk._connect.public.connector_connect import ConnectorServiceClient
from textql_sdk.streaming import create_connect_client, create_streaming_client

from app import textql_router
from app.textql_router import router

load_dotenv()

logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO"),
    format="%(asctime)s %(levelname)-7s %(name)s  %(message)s",
)
logger = logging.getLogger("demo")

ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
).split(",")


@asynccontextmanager
async def lifespan(_app: FastAPI):
    api_key = os.getenv("TEXTQL_API_KEY")
    if not api_key:
        raise RuntimeError("TEXTQL_API_KEY is not set — copy .env.example to .env")

    server_url = os.getenv("TEXTQL_SERVER_URL") or None
    ctx = truststore.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
    http_client = httpx.AsyncClient(
        follow_redirects=True,
        timeout=httpx.Timeout(None, connect=10.0),
        verify=ctx,
    )
    sdk = Textql(api_key=api_key, server_url=server_url, async_client=http_client)
    streaming = create_streaming_client(sdk)
    connectors = create_connect_client(ConnectorServiceClient, sdk)

    textql_router._sdk = sdk
    textql_router._streaming = streaming
    textql_router._connectors = connectors
    logger.info("SDK ready | server_url=%s", server_url or "(default)")

    try:
        yield
    finally:
        textql_router._sdk = None
        textql_router._streaming = None
        textql_router._connectors = None
        await http_client.aclose()


app = FastAPI(title="TextQL Streaming Demo", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Cell-Id"],
)

app.include_router(router)


@app.get("/health")
async def health():
    return {"status": "ok", "sdk_ready": textql_router._sdk is not None}
