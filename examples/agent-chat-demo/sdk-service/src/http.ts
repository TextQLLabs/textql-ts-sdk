import { timingSafeEqual } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import { once } from "node:events";
import Busboy from "busboy";
import { Code, ConnectError } from "@connectrpc/connect";
import type { JsonObject } from "@bufbuild/protobuf";

export const MAX_FILE_BYTES = 20 * 1024 * 1024;

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export function authenticated(
  request: IncomingMessage,
  token: string,
): boolean {
  const header = request.headers["x-sdk-token"];
  if (typeof header !== "string") return false;
  const supplied = Buffer.from(header);
  const expected = Buffer.from(token);
  return (
    supplied.length === expected.length && timingSafeEqual(supplied, expected)
  );
}

export function json(
  response: ServerResponse,
  body: unknown,
  status = 200,
): void {
  response.writeHead(status, {
    "content-type": "application/json",
    "cache-control": "no-store",
  });
  response.end(JSON.stringify(body));
}

export function errorResponse(response: ServerResponse, error: unknown): void {
  if (response.destroyed) return;
  let status = 502;
  let detail =
    "TextQL request failed. Check the server configuration and permissions.";
  if (error instanceof HttpError) {
    status = error.status;
    detail = error.message;
  } else if (error instanceof ConnectError) {
    const statuses: Partial<Record<Code, number>> = {
      [Code.InvalidArgument]: 400,
      [Code.NotFound]: 404,
      [Code.PermissionDenied]: 403,
      [Code.Unauthenticated]: 401,
      [Code.ResourceExhausted]: 429,
      [Code.FailedPrecondition]: 409,
      [Code.DeadlineExceeded]: 504,
    };
    status = statuses[error.code] ?? 502;
    detail = `TextQL request failed (${Code[error.code]}).`;
  }
  if (response.headersSent) {
    response.end(
      `data: ${JSON.stringify({ type: "runError", runError: { error: detail } })}\n\n`,
    );
    return;
  }
  json(response, { detail }, status);
}

export async function readJson(request: IncomingMessage): Promise<JsonObject> {
  let length = 0;
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    length += chunk.length;
    if (length > 1024 * 1024)
      throw new HttpError(413, "JSON request is too large.");
    chunks.push(Buffer.from(chunk));
  }
  if (!length) return {};
  try {
    const body: unknown = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    if (!body || typeof body !== "object" || Array.isArray(body))
      throw new Error();
    return body as JsonObject;
  } catch {
    throw new HttpError(400, "Expected a JSON object.");
  }
}

export function stringField(
  value: unknown,
  name: string,
  fallback?: string,
): string {
  if (value === undefined && fallback !== undefined) return fallback;
  if (typeof value !== "string" || (fallback === undefined && !value.trim())) {
    throw new HttpError(400, `${name} must be a nonempty string.`);
  }
  return value;
}

export function booleanField(
  value: unknown,
  name: string,
  fallback: boolean,
): boolean {
  if (value === undefined) return fallback;
  if (typeof value !== "boolean")
    throw new HttpError(400, `${name} must be a boolean.`);
  return value;
}

export function integerParam(
  params: URLSearchParams,
  key: string,
  fallback: number,
  min: number,
  max = Number.MAX_SAFE_INTEGER,
): number {
  if (!params.has(key)) return fallback;
  const value = Number(params.get(key));
  if (!Number.isSafeInteger(value) || value < min || value > max) {
    throw new HttpError(
      400,
      `${key} must be an integer between ${min} and ${max}.`,
    );
  }
  return value;
}

export async function writeSse(
  response: ServerResponse,
  event: unknown,
  signal: AbortSignal,
): Promise<void> {
  if (signal.aborted) return;
  if (!response.write(`data: ${JSON.stringify(event)}\n\n`)) {
    await once(response, "drain", { signal });
  }
}

export function readFile(
  request: IncomingMessage,
): Promise<{ name: string; bytes: Buffer }> {
  return new Promise((resolve, reject) => {
    let parser: ReturnType<typeof Busboy>;
    try {
      parser = Busboy({
        headers: request.headers,
        defParamCharset: "utf8",
        limits: { files: 1, fields: 0, parts: 2, fileSize: MAX_FILE_BYTES + 1 },
      });
    } catch {
      reject(
        new HttpError(400, "Expected multipart/form-data with one file field."),
      );
      return;
    }
    let failure: HttpError | undefined;
    let name = "";
    let size = 0;
    let total = 0;
    const chunks: Buffer[] = [];
    const onData = (chunk: Buffer) => {
      total += chunk.length;
      if (total > MAX_FILE_BYTES + 64 * 1024) {
        request.unpipe(parser);
        parser.destroy(new HttpError(413, "File exceeds the 20 MiB limit."));
        request.resume();
      }
    };
    const onAborted = () =>
      parser.destroy(new HttpError(400, "Upload interrupted."));
    request.on("data", onData);
    request.once("aborted", onAborted);
    parser.on("file", (field, stream, info) => {
      name = info.filename;
      if (
        field !== "file" ||
        !name ||
        name.includes("\\") ||
        !name.includes(".")
      ) {
        failure = new HttpError(
          400,
          "Use the file field with a filename including an extension.",
        );
      }
      stream.on("limit", () => {
        failure = new HttpError(413, "File exceeds the 20 MiB limit.");
      });
      stream.on("error", () => {
        failure ??= new HttpError(400, "Invalid multipart file.");
      });
      stream.on("data", (chunk: Buffer) => {
        size += chunk.length;
        if (size > MAX_FILE_BYTES)
          failure = new HttpError(413, "File exceeds the 20 MiB limit.");
        if (!failure) chunks.push(chunk);
      });
    });
    parser.on("filesLimit", () => {
      failure = new HttpError(400, "Upload exactly one file.");
    });
    parser.on("fieldsLimit", () => {
      failure = new HttpError(400, "Only the file field is accepted.");
    });
    parser.on("partsLimit", () => {
      failure ??= new HttpError(400, "Upload exactly one file.");
    });
    parser.on("error", (error) =>
      reject(
        error instanceof HttpError
          ? error
          : new HttpError(400, "Invalid multipart upload."),
      ),
    );
    parser.on("close", () => {
      request.off("data", onData);
      request.off("aborted", onAborted);
      if (failure) reject(failure);
      else if (!name || !size)
        reject(new HttpError(400, "Upload one nonempty file."));
      else resolve({ name, bytes: Buffer.concat(chunks) });
    });
    request.pipe(parser);
  });
}
