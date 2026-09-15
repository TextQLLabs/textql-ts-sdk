"""Dataset uploads and durable attachment history through the Python SDK."""

import logging
from pathlib import PurePosixPath
from time import perf_counter
from urllib.parse import parse_qs, urlparse

import httpx
from fastapi import HTTPException
from google.protobuf.json_format import MessageToDict
from textql_sdk._connect.public import chat_pb2, dataset_pb2

logger = logging.getLogger("uvicorn.error")


async def timed_upload_step(name, operation, timings):
    started = perf_counter()
    logger.info("Upload stage %s started", name)
    try:
        return await operation
    finally:
        timings[name] = (perf_counter() - started) * 1000
        logger.info("Upload stage %s finished in %.0f ms", name, timings[name])


MAX_FILE_BYTES = 20 * 1024 * 1024

TABULARMIME = {
    ".csv": "text/csv",
    ".tsv": "text/tab-separated-values",
    ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ".xlsm": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ".xls": "application/vnd.ms-excel",
    ".parquet": "application/vnd.apache.parquet",
    ".ods": "application/vnd.oasis.opendocument.spreadsheet",
}

IMAGEMIME = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".heic": "image/heic",
    ".heif": "image/heif",
}

TEXTMIME = {
    ".txt": "text/plain",
    ".md": "text/markdown",
    ".json": "application/json",
    ".xml": "application/xml",
    ".yaml": "application/x-yaml",
    ".yml": "application/x-yaml",
    ".html": "text/html",
    ".css": "text/css",
    ".js": "application/javascript",
    ".ts": "application/typescript",
    ".jsx": "text/jsx",
    ".tsx": "text/tsx",
    ".py": "text/x-python",
    ".java": "text/x-java",
    ".c": "text/x-c",
    ".cpp": "text/x-c++",
    ".h": "text/x-c",
    ".cs": "text/x-csharp",
    ".go": "text/x-go",
    ".rs": "text/x-rust",
    ".php": "text/x-php",
    ".rb": "text/x-ruby",
    ".swift": "text/x-swift",
    ".kt": "text/x-kotlin",
    ".sql": "application/sql",
    ".sh": "application/x-sh",
    ".bash": "application/x-sh",
    ".env": "text/plain",
    ".ini": "text/plain",
    ".cfg": "text/plain",
    ".conf": "text/plain",
    ".log": "text/plain",
    ".gitignore": "text/plain",
    ".toml": "application/toml",
    ".proto": "text/x-protobuf",
    ".graphql": "application/graphql",
    ".xer": "text/plain",
    ".mjs": "application/javascript",
    ".cjs": "application/javascript",
    ".scss": "text/x-scss",
    ".sass": "text/x-sass",
    ".less": "text/x-less",
    ".svg": "image/svg+xml",
    ".webmanifest": "application/manifest+json",
    ".map": "application/json",
    ".geojson": "application/geo+json",
    ".prj": "text/plain",
    ".cpg": "text/plain",
    ".tql": "text/vnd.tql",
    ".playbook": "text/vnd.tql",
    ".dashboard": "text/vnd.tql",
    ".agent": "text/vnd.tql",
    ".pipeline": "text/vnd.tql",
    ".dataapp": "text/vnd.tql",
}

DOCUMENTMIME = {
    ".pdf": "application/pdf",
    ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ".pptm": "application/vnd.ms-powerpoint.presentation.macroEnabled.12",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".docm": "application/vnd.ms-word.document.macroEnabled.12",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
    ".ttf": "font/ttf",
    ".otf": "font/otf",
    ".ico": "image/x-icon",
    ".shp": "application/x-esri-shape",
    ".shx": "application/x-esri-shape",
}

PLAIN_TEXT_EXTENSIONS = {
    ".properties",
    ".malloy",
    ".patch",
    ".hpp",
    ".erl",
    ".diff",
    ".lisp",
    ".scala",
    ".vb",
    ".markdown",
    ".lua",
    ".pl",
    ".hs",
    ".m",
    ".ml",
    ".r",
    ".fs",
    ".vim",
    ".zsh",
    ".el",
    ".clj",
}


def classify_file(name):
    extension = PurePosixPath(name).suffix.lower()
    for mapping, kind in (
        (TABULARMIME, dataset_pb2.TYPE_TABULAR),
        (IMAGEMIME, dataset_pb2.TYPE_IMAGE),
        (TEXTMIME, dataset_pb2.TYPE_TEXT),
    ):
        if extension in mapping:
            return kind, mapping[extension]
    if extension in PLAIN_TEXT_EXTENSIONS:
        return dataset_pb2.TYPE_TEXT, "text/plain"
    return dataset_pb2.TYPE_DOCUMENT, DOCUMENTMIME.get(
        extension, "application/octet-stream"
    )


def file_from_cell(cell, dataset=None):
    value = cell.WhichOneof("value")
    if not value:
        return None
    payload = getattr(cell, value)
    dataset_id = getattr(payload, "dataset_source_id", "")
    if not dataset_id:
        return None
    result = {
        "id": dataset_id,
        "name": (dataset.name if dataset else "")
        or getattr(payload, "file_name", "")
        or getattr(payload, "name", ""),
        "status": "attached",
        "cell_id": cell.id,
        "cell": MessageToDict(cell),
    }
    if dataset is not None:
        result["dataset"] = MessageToDict(dataset)
    return result


async def attached_files(chats, chat_id):
    files = {}
    skip = 0
    while True:
        page = await chats.get_chat_history(
            chat_pb2.HistoryRequest(chat_id=chat_id, limit=200, skip=skip)
        )
        for cell in page.cells:
            file = file_from_cell(cell)
            if file:
                files[file["id"]] = file
        skip += len(page.cells)
        if not page.has_more or not page.cells:
            return list(files.values())


async def upload_file(datasets, http, name, content, timings=None):
    if timings is None:
        timings = {}
    kind, content_type = classify_file(name)
    registered = await timed_upload_step(
        "register",
        datasets.create_upload_presign_url(
            dataset_pb2.CreateUploadPresignUrlRequest(
                type=kind, file_name=name, ephemeral=True
            )
        ),
        timings,
    )
    if (
        not registered.dataset_id
        or not registered.presign_url
        or registered.dataset_version < 1
    ):
        raise HTTPException(502, "TextQL did not return a valid upload registration.")
    signed = urlparse(registered.presign_url)
    if (
        signed.scheme not in ("https", "http")
        or not signed.hostname
        or signed.username
        or signed.password
    ):
        raise HTTPException(502, "TextQL returned an invalid upload URL.")
    headers = {"content-type": content_type}
    query = parse_qs(signed.query)
    if "sig" in query and "sv" in query:
        headers["x-ms-blob-type"] = "BlockBlob"
    # This HTTP client has no TextQL credentials. Signed storage requests use only
    # the URL's authorization, never the API key or browser-provided headers.
    try:
        uploaded = await timed_upload_step(
            "transfer",
            http.put(
                registered.presign_url,
                headers=headers,
                content=content,
                timeout=120.0,
                follow_redirects=False,
            ),
            timings,
        )
    except httpx.HTTPError:
        raise HTTPException(
            502, "File transfer to storage failed. The file was not attached."
        ) from None
    if not uploaded.is_success:
        raise HTTPException(
            502, "File transfer to storage failed. The file was not attached."
        )
    processed = await timed_upload_step(
        "process",
        datasets.process_upload_presign_url(
            dataset_pb2.ProcessUploadPresignUrlRequest(
                dataset_id=registered.dataset_id,
                dataset_version=registered.dataset_version,
            )
        ),
        timings,
    )
    if processed.dataset.id != registered.dataset_id:
        raise HTTPException(
            502,
            "TextQL did not confirm the uploaded dataset. The file was not attached.",
        )
    return {"id": registered.dataset_id, "name": name, "status": "uploaded"}


async def attach_uploaded_file(chats, chat_id, dataset_id, timings):
    attached = await timed_upload_step(
        "attach",
        chats.attach_dataset(
            chat_pb2.AttachDatasetRequest(
                chat_id=chat_id, dataset_id=dataset_id
            )
        ),
        timings,
    )
    if not attached.cell.id or attached.dataset.id != dataset_id:
        raise HTTPException(
            502,
            "TextQL did not confirm file attachment. Reload the chat before retrying.",
        )
    result = file_from_cell(attached.cell, attached.dataset)
    if not result or result["id"] != dataset_id:
        raise HTTPException(
            502,
            "TextQL returned an unexpected attachment cell. Reload the chat before retrying.",
        )
    return result
