"""FastAPI owns every browser API endpoint and calls the TextQL Python SDK."""

import os
import ssl
from contextlib import asynccontextmanager
from pathlib import Path
from urllib.parse import urlsplit, urlunsplit

import httpx
import truststore
from connectrpc.code import Code
from connectrpc.errors import ConnectError
from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from textql_sdk import Textql
from textql_sdk._connect.public.connector_connect import ConnectorServiceClient
from textql_sdk._connect.public.dataset_connect import DatasetServiceClient
from textql_sdk.streaming import create_connect_client, create_streaming_client

from app import textql_router

DEMO_ROOT = Path(__file__).resolve().parents[2]
MAX_REQUEST_BYTES = 21 * 1024 * 1024
load_dotenv(DEMO_ROOT / ".env")


@asynccontextmanager
async def lifespan(app: FastAPI):
    for name in ("TEXTQL_API_KEY", "TEXTQL_AGENT_ID"):
        if not os.getenv(name, "").strip():
            raise RuntimeError(f"Set {name} in the example's .env file.")
    url = urlsplit(
        os.getenv("TEXTQL_SERVER_URL") or "https://app.textql.com/rpc/public"
    )
    if (
        url.scheme not in ("http", "https")
        or not url.hostname
        or url.username
        or url.password
    ):
        raise RuntimeError(
            "TEXTQL_SERVER_URL must be an HTTP(S) URL without credentials."
        )
    path = url.path.rstrip("/")
    if not path.endswith("/rpc/public"):
        path += "/rpc/public"
    server_url = urlunsplit((url.scheme, url.netloc, path, "", ""))
    tls = truststore.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
    async with (
        httpx.AsyncClient(
            verify=tls, timeout=httpx.Timeout(None, connect=10.0)
        ) as sdk_http,
        httpx.AsyncClient(
            verify=tls, timeout=30.0, follow_redirects=False
        ) as storage_http,
    ):
        sdk = Textql(
            api_key=os.environ["TEXTQL_API_KEY"].strip(),
            server_url=server_url,
            async_client=sdk_http,
        )
        textql_router._sdk = sdk
        textql_router._streaming = create_streaming_client(sdk)
        textql_router._connectors = create_connect_client(ConnectorServiceClient, sdk)
        textql_router._http = storage_http
        app.state.datasets = create_connect_client(DatasetServiceClient, sdk)
        try:
            yield
        finally:
            textql_router._sdk = None
            textql_router._streaming = None
            textql_router._connectors = None
            textql_router._http = None
            app.state.datasets = None


class RequestSizeLimit:
    """Bound request bytes before parsing JSON or multipart bodies."""

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http" or scope["method"] not in ("POST", "PUT", "PATCH"):
            return await self.app(scope, receive, send)
        body = bytearray()
        while True:
            message = await receive()
            if message["type"] == "http.disconnect":
                return
            body.extend(message.get("body", b""))
            if len(body) > MAX_REQUEST_BYTES:
                response = JSONResponse(
                    {"detail": "The request exceeds the 21 MiB limit."}, status_code=413
                )
                return await response(scope, receive, send)
            if not message.get("more_body", False):
                break
        delivered = False

        async def replay():
            nonlocal delivered
            if not delivered:
                delivered = True
                return {"type": "http.request", "body": bytes(body), "more_body": False}
            return await receive()

        await self.app(scope, replay, send)


app = FastAPI(title="TextQL Agent Chat Demo", lifespan=lifespan)
app.add_middleware(RequestSizeLimit)
app.include_router(textql_router.router)


@app.exception_handler(ConnectError)
async def connect_error(request: Request, error: ConnectError):
    status = {
        Code.INVALID_ARGUMENT: 400,
        Code.UNAUTHENTICATED: 401,
        Code.PERMISSION_DENIED: 403,
        Code.NOT_FOUND: 404,
        Code.ALREADY_EXISTS: 409,
        Code.FAILED_PRECONDITION: 409,
        Code.RESOURCE_EXHAUSTED: 429,
        Code.UNAVAILABLE: 503,
        Code.DEADLINE_EXCEEDED: 504,
    }.get(error.code, 502)
    return JSONResponse(
        {"detail": f"TextQL request failed ({error.code.name})."}, status_code=status
    )


@app.exception_handler(httpx.HTTPError)
async def transport_error(request: Request, error: httpx.HTTPError):
    return JSONResponse({"detail": "TextQL is unavailable."}, status_code=502)


@app.get("/health")
async def health():
    ready = textql_router._sdk is not None
    return JSONResponse(
        {"status": "ok" if ready else "unavailable", "sdk": "python"},
        status_code=200 if ready else 503,
    )
