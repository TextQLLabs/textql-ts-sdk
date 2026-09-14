import { extname } from "node:path";
import { toJson } from "@bufbuild/protobuf";
import {
  CellSchema,
  type Cell,
} from "@textql/sdk/generated/connect/public/chat_pb";
import {
  DatasetSchema,
  DatasetType,
  type Dataset,
} from "@textql/sdk/generated/connect/public/dataset_pb";
import type { Sdk } from "./sdk.js";
import { HttpError } from "./http.js";

const tabularMime: Record<string, string> = {
  ".csv": "text/csv",
  ".tsv": "text/tab-separated-values",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".xlsm": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".xls": "application/vnd.ms-excel",
  ".parquet": "application/vnd.apache.parquet",
  ".ods": "application/vnd.oasis.opendocument.spreadsheet",
};

const imageMime: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".heic": "image/heic",
  ".heif": "image/heif",
};

const textMime: Record<string, string> = {
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
};

const documentMime: Record<string, string> = {
  ".pdf": "application/pdf",
  ".pptx":
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".pptm": "application/vnd.ms-powerpoint.presentation.macroEnabled.12",
  ".docx":
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".docm": "application/vnd.ms-word.document.macroEnabled.12",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
  ".ico": "image/x-icon",
  ".shp": "application/x-esri-shape",
  ".shx": "application/x-esri-shape",
};

const plainTextExtensions = new Set([
  ".markdown",
  ".diff",
  ".patch",
  ".zsh",
  ".hpp",
  ".properties",
  ".pl",
  ".r",
  ".m",
  ".vb",
  ".fs",
  ".clj",
  ".scala",
  ".lua",
  ".vim",
  ".el",
  ".lisp",
  ".hs",
  ".ml",
  ".erl",
  ".malloy",
]);

export function classifyFile(name: string): {
  type: DatasetType;
  contentType: string;
} {
  const extension = extname(name).toLowerCase();
  if (tabularMime[extension])
    return {
      type: DatasetType.TYPE_TABULAR,
      contentType: tabularMime[extension],
    };
  if (imageMime[extension])
    return { type: DatasetType.TYPE_IMAGE, contentType: imageMime[extension] };
  if (textMime[extension])
    return { type: DatasetType.TYPE_TEXT, contentType: textMime[extension] };
  if (plainTextExtensions.has(extension))
    return { type: DatasetType.TYPE_TEXT, contentType: "text/plain" };
  return {
    type: DatasetType.TYPE_DOCUMENT,
    contentType: documentMime[extension] ?? "application/octet-stream",
  };
}

export function fileFromCell(cell: Cell, dataset?: Dataset) {
  const payload = cell.value.value;
  if (!payload || !("datasetSourceId" in payload) || !payload.datasetSourceId)
    return undefined;
  const name = "fileName" in payload ? payload.fileName : payload.name;
  return {
    id: payload.datasetSourceId,
    name: dataset?.name || name,
    status: "attached" as const,
    cell_id: cell.id,
    cell: toJson(CellSchema, cell),
    ...(dataset ? { dataset: toJson(DatasetSchema, dataset) } : {}),
  };
}

export async function uploadFile(
  sdk: Sdk,
  chatId: string,
  file: { name: string; bytes: Buffer },
  fetcher: typeof fetch,
  signal: AbortSignal,
) {
  const classification = classifyFile(file.name);
  const registered = await sdk.datasets.createUploadPresignUrl(
    {
      type: classification.type,
      fileName: file.name,
      ephemeral: true,
    },
    { signal },
  );
  if (
    !registered.datasetId ||
    !registered.presignUrl ||
    registered.datasetVersion < 1
  ) {
    throw new HttpError(
      502,
      "TextQL did not return a valid upload registration.",
    );
  }
  const signed = new URL(registered.presignUrl);
  if (
    !["https:", "http:"].includes(signed.protocol) ||
    signed.username ||
    signed.password
  ) {
    throw new HttpError(502, "TextQL returned an invalid upload URL.");
  }
  const headers: Record<string, string> = {
    "content-type": classification.contentType,
  };
  if (signed.searchParams.has("sig") && signed.searchParams.has("sv"))
    headers["x-ms-blob-type"] = "BlockBlob";
  let uploaded: Response;
  try {
    uploaded = await fetcher(signed, {
      method: "PUT",
      headers,
      body: new Uint8Array(file.bytes),
      redirect: "error",
      signal: AbortSignal.any([signal, AbortSignal.timeout(120_000)]),
    });
  } catch {
    throw new HttpError(
      502,
      "File transfer to storage failed. The file was not attached.",
    );
  }
  await uploaded.body?.cancel();
  if (!uploaded.ok)
    throw new HttpError(
      502,
      `File transfer to storage failed (${uploaded.status}). The file was not attached.`,
    );
  const processed = await sdk.datasets.processUploadPresignUrl(
    {
      datasetId: registered.datasetId,
      datasetVersion: registered.datasetVersion,
    },
    { signal },
  );
  if (processed.dataset?.id !== registered.datasetId) {
    throw new HttpError(
      502,
      "TextQL did not confirm the uploaded dataset. The file was not attached.",
    );
  }
  const attached = await sdk.chats.attachDataset(
    { chatId, datasetId: registered.datasetId },
    { signal },
  );
  if (!attached.cell?.id || attached.dataset?.id !== registered.datasetId) {
    throw new HttpError(
      502,
      "TextQL did not confirm file attachment. Reload the chat before retrying.",
    );
  }
  const result = fileFromCell(attached.cell, attached.dataset);
  if (!result || result.id !== registered.datasetId) {
    throw new HttpError(
      502,
      "TextQL returned an unexpected attachment cell. Reload the chat before retrying.",
    );
  }
  return result;
}
