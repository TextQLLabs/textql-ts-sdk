import asyncio
import os
import secrets
from contextlib import asynccontextmanager
from pathlib import Path

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, StreamingResponse
from starlette.background import BackgroundTask

DEMO_ROOT = Path(__file__).resolve().parents[2]
MAX_REQUEST_BYTES = 21 * 1024 * 1024
load_dotenv(DEMO_ROOT / ".env")


@asynccontextmanager
async def lifespan(app: FastAPI):
    for name in ("TEXTQL_API_KEY", "TEXTQL_AGENT_ID"):
        if not os.getenv(name, "").strip():
            raise RuntimeError(f"Set {name} in the example's .env file.")
    token = secrets.token_urlsafe(32)
    port = int(os.getenv("SDK_SERVICE_PORT", "8788"))
    process = await asyncio.create_subprocess_exec(
        "node",
        "--import",
        "tsx",
        "src/index.ts",
        cwd=DEMO_ROOT / "sdk-service",
        env={**os.environ, "SDK_SERVICE_TOKEN": token, "SDK_SERVICE_PORT": str(port)},
    )
    try:
        async with httpx.AsyncClient(
            base_url=f"http://127.0.0.1:{port}",
            headers={"X-SDK-Token": token},
            timeout=httpx.Timeout(None, connect=5.0),
            trust_env=False,
        ) as client:
            for _ in range(100):
                if process.returncode is not None:
                    raise RuntimeError(
                        "The TypeScript SDK service exited during startup."
                    )
                try:
                    response = await client.get("/health", timeout=1.0)
                    if response.is_success:
                        break
                except httpx.TransportError:
                    pass
                await asyncio.sleep(0.1)
            else:
                raise RuntimeError("The TypeScript SDK service did not become ready.")
            app.state.sdk_client = client
            yield
    finally:
        if process.returncode is None:
            process.terminate()
            try:
                await asyncio.wait_for(process.wait(), timeout=5.0)
            except asyncio.TimeoutError:
                process.kill()
                await process.wait()


app = FastAPI(title="TextQL Agent Chat Demo", lifespan=lifespan)


@app.get("/health")
async def health(request: Request):
    try:
        response = await request.app.state.sdk_client.get("/health", timeout=2.0)
        return JSONResponse(
            {"status": "ok" if response.is_success else "unavailable"},
            status_code=200 if response.is_success else 503,
        )
    except httpx.TransportError:
        return JSONResponse({"status": "unavailable"}, status_code=503)


@app.api_route("/v3/textql/{path:path}", methods=["GET", "POST", "DELETE"])
async def proxy(request: Request, path: str):
    body = bytearray()
    async for chunk in request.stream():
        if len(body) + len(chunk) > MAX_REQUEST_BYTES:
            return JSONResponse(
                {"detail": "The request exceeds the 21 MiB limit."}, status_code=413
            )
        body.extend(chunk)

    client: httpx.AsyncClient = request.app.state.sdk_client
    url = httpx.URL(path="/v3/textql/" + path, query=request.scope["query_string"])
    headers = {}
    if content_type := request.headers.get("content-type"):
        headers["content-type"] = content_type
    upstream = client.build_request(
        request.method, url, content=bytes(body), headers=headers
    )
    try:
        response = await client.send(upstream, stream=True)
    except httpx.TransportError:
        return JSONResponse(
            {"detail": "The SDK service is unavailable."}, status_code=502
        )

    async def stream():
        try:
            async for chunk in response.aiter_bytes():
                yield chunk
        finally:
            await response.aclose()

    return StreamingResponse(
        stream(),
        status_code=response.status_code,
        headers={
            key: value
            for key, value in response.headers.items()
            if key
            in {
                "content-type",
                "cache-control",
                "x-cell-id",
                "x-accel-buffering",
                "content-security-policy",
                "x-content-type-options",
                "content-disposition",
            }
        },
        background=BackgroundTask(response.aclose),
    )
