/**
 * Embed a Data App in your own web app.
 *
 * Pair this with `@textql/sdk/embed/element`, which registers the
 * `<textql-app>` element that talks to these routes. See EMBED.md.
 *
 * The routes exist because the API key is org-wide and must stay on your
 * server, and because a published app has to be re-served from your origin —
 * see `appDocument` below.
 */
import { Textql } from "./sdk/sdk.js";
import type { ConnectError } from "./models/connect-error.js";
import type { TextqlRpcPublicAppApp } from "./models/textql-rpc-public-app-app.js";

/** Mount point assumed by `@textql/sdk/embed/element` when given no `api-base`. */
export const DEFAULT_BASE_PATH = "/api/textql";

/** What the element needs to render. The signed document URL is deliberately absent. */
export interface EmbedAppMeta {
  name: string;
  screenshotUrl: string | null;
  /** Compute functions the app declares; the only names `compute` will invoke. */
  functions: string[];
}

export interface EmbedOptions {
  /**
   * The app to serve. Defaults to `TEXTQL_APP_ID`. Pass a function to pick per
   * request — from your session, a tenant header, a route param.
   */
  appId?: string | ((request: Request) => string | Promise<string>) | undefined;
  /** Defaults to a client built from `TEXTQL_API_KEY` / `TEXTQL_SERVER_URL`. */
  client?: Textql | undefined;
  /** Where the handler is mounted. Must match the element's `api-base`. */
  basePath?: string | undefined;
  /**
   * Called before every request. Return false (or throw) to reject. Nothing
   * else here knows who the caller is, so without this the app is visible to
   * anyone who can reach the route.
   */
  authorize?: (request: Request) => boolean | Promise<boolean>;
  /**
   * Serve the app document from your origin. On by default because a published
   * app is pinned to the origin it was published for and will not frame
   * anywhere else. Turn off only once your origin is allowed platform-side.
   */
  rehostDocument?: boolean | undefined;
}

/** Returns `null` when the request is not for one of the embed routes. */
export type EmbedHandler = (request: Request) => Promise<Response | null>;

export class EmbedError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "EmbedError";
  }
}

/**
 * The published `hostOrigin` tag, as written by compute's `pkg/app/shell.go`.
 * A literal from another repo, so `appDocument` fails loudly if it drifts.
 */
const PUBLISHED_CONFIG =
  /<script>window\.ANA_RUNTIME_CONFIG\s*=\s*\{[^}]*\};?<\/script>/;

function envAppId(): string {
  const globals = globalThis as {
    Deno?: { env?: { get?: (key: string) => string | undefined } };
    process?: { env?: Record<string, string | undefined> };
  };
  const value = globals.Deno?.env?.get?.("TEXTQL_APP_ID")
    ?? globals.process?.env?.["TEXTQL_APP_ID"];
  if (!value) {
    throw new EmbedError(
      503,
      "No app to embed: set TEXTQL_APP_ID, or pass `appId` to createEmbedHandler.",
    );
  }
  return value;
}

/** Unary RPCs resolve to `Response | ConnectError` rather than rejecting. */
function unwrap<T extends object>(response: T | ConnectError, fallback: string): T {
  if ("code" in response || "details" in response) {
    const message = (response as ConnectError).message;
    throw new EmbedError(502, typeof message === "string" ? message : fallback);
  }
  return response as T;
}

function toMeta(app: TextqlRpcPublicAppApp): EmbedAppMeta {
  return {
    name: app.name?.trim() || "Data app",
    screenshotUrl: app.screenshotUrl?.trim() || null,
    functions: (app.computeFunctions ?? [])
      .map((fn) => fn.name)
      .filter((name): name is string => !!name),
  };
}

class Embed {
  readonly basePath: string;
  private readonly options: EmbedOptions;
  private client: Textql | undefined;

  constructor(options: EmbedOptions) {
    this.options = options;
    this.basePath = (options.basePath ?? DEFAULT_BASE_PATH).replace(/\/+$/, "");
  }

  private sdk(): Textql {
    // Built lazily so a missing key surfaces as a 503 on the first request
    // rather than a throw at import time.
    this.client ??= this.options.client ?? new Textql();
    return this.client;
  }

  private async appId(request: Request): Promise<string> {
    const configured = this.options.appId;
    if (typeof configured === "function") return configured(request);
    return configured ?? envAppId();
  }

  private async fetchApp(request: Request): Promise<TextqlRpcPublicAppApp> {
    const appId = await this.appId(request);
    const result = unwrap(
      await this.sdk().apps.get({ body: { appId } }),
      "Unable to load the app.",
    );
    const app = result.app;
    if (!app) throw new EmbedError(404, "That app does not exist.");
    return app;
  }

  async meta(request: Request): Promise<EmbedAppMeta> {
    return toMeta(await this.fetchApp(request));
  }

  /** The signed, expiring CDN URL. Only used when rehosting is off. */
  async documentUrl(request: Request): Promise<string> {
    const app = await this.fetchApp(request);
    if (!app.htmlUrl) throw new EmbedError(404, "That app has not been rendered yet.");
    return app.htmlUrl;
  }

  /**
   * Re-serves the app's HTML from your origin, because a published app is
   * pinned to one origin twice over: a `frame-ancestors` header
   * (`pkg/remote/proxy/assets.go`) that stops the frame rendering at all, and a
   * baked-in `ANA_RUNTIME_CONFIG.hostOrigin` (`pkg/app/shell.go`) that is the
   * only origin its runtime will postMessage. Serving it ourselves clears the
   * first; rewriting the config clears the second. `<base href>` keeps
   * subresources on the CDN, which already serves them with `ACAO: *`.
   */
  async document(request: Request, hostOrigin: string): Promise<string> {
    const app = await this.fetchApp(request);
    if (!app.htmlUrl) throw new EmbedError(404, "That app has not been rendered yet.");
    const url = app.htmlUrl;

    const upstream = await fetch(url);
    if (!upstream.ok) {
      throw new EmbedError(502, `The app document returned ${upstream.status}.`);
    }
    const html = await upstream.text();

    const configTag =
      `<script>window.ANA_RUNTIME_CONFIG = {hostOrigin: ${JSON.stringify(hostOrigin)}};</script>`;
    const rewritten = html.replace(PUBLISHED_CONFIG, configTag);

    // A silent no-op here leaves the CDN as the runtime's peer, and every
    // bridge call then hangs for the runtime's 175s timeout.
    if (rewritten === html && html.includes("ANA_RUNTIME_CONFIG")) {
      throw new EmbedError(
        502,
        "TextQL's app shell changed shape; upgrade @textql/sdk to embed this app.",
      );
    }

    // Older apps ship no config tag; without one the runtime falls back to its
    // own script's origin, which is the CDN, not you.
    const injected = `<base href="${new URL(".", url).href}">`
      + (rewritten === html ? configTag : "");
    return rewritten.replace(/<head[^>]*>/i, (head) => head + injected);
  }

  async compute(request: Request, body: unknown): Promise<unknown> {
    const name = (body as { name?: unknown } | null)?.name;
    const params = (body as { params?: unknown } | null)?.params;
    if (typeof name !== "string" || !name) {
      throw new EmbedError(400, "Expected a JSON body of { name, params }.");
    }

    // The iframe can post any name it likes; without this the route is a
    // generic runner for anything the org's key can reach.
    const app = await this.fetchApp(request);
    if (!toMeta(app).functions.includes(name)) {
      throw new EmbedError(403, `${name} is not a compute function of this app.`);
    }

    const result = unwrap(
      await this.sdk().apps.invokeComputeFunction({
        body: {
          appId: app.id ?? (await this.appId(request)),
          functionName: name,
          paramsJson: JSON.stringify(params ?? {}),
        },
      }),
      `${name} failed.`,
    );

    const raw = result.resultJson ?? "null";
    try {
      return JSON.parse(raw) as unknown;
    } catch {
      return raw;
    }
  }
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

function errorResponse(cause: unknown): Response {
  if (cause instanceof EmbedError) return json({ error: cause.message }, cause.status);
  const status = (cause as { statusCode?: unknown })?.statusCode;
  // The SDK throws on non-2xx rather than returning the union, so a bad key is
  // a 401 here, not an opaque 500.
  if (typeof status === "number") return json({ error: `TextQL returned ${status}.` }, status);
  return json({ error: "The embed request failed." }, 500);
}

/**
 * Handles the three routes `<textql-app>` calls, under `basePath`:
 *
 *   GET  {basePath}/app       → { name, screenshotUrl, functions }
 *   GET  {basePath}/document  → the app's HTML, served from your origin
 *   POST {basePath}/compute   → { result }
 *
 * Returns `null` for anything else, so it composes with your own routing.
 */
export function createEmbedHandler(
  options: EmbedOptions = {},
): EmbedHandler & { GET: EmbedHandler; POST: EmbedHandler } {
  const embed = new Embed(options);

  const handler: EmbedHandler = async (request) => {
    const route = new URL(request.url).pathname.replace(/\/+$/, "");
    if (!route.startsWith(embed.basePath)) return null;
    const suffix = route.slice(embed.basePath.length);
    if (suffix !== "/app" && suffix !== "/document" && suffix !== "/compute") return null;

    try {
      if (options.authorize && (await options.authorize(request)) === false) {
        throw new EmbedError(403, "Not allowed to view this app.");
      }

      if (suffix === "/app" && request.method === "GET") {
        return json(await embed.meta(request));
      }

      if (suffix === "/document" && request.method === "GET") {
        if (options.rehostDocument === false) {
          return Response.redirect(await embed.documentUrl(request), 302);
        }
        const html = await embed.document(request, new URL(request.url).origin);
        return new Response(html, {
          headers: {
            "content-type": "text/html; charset=utf-8",
            // Untrusted HTML on your origin; without this it is same-origin
            // with the host page even when framed.
            "content-security-policy": "sandbox allow-scripts",
            "cache-control": "no-store",
          },
        });
      }

      if (suffix === "/compute" && request.method === "POST") {
        const body = await request.json().catch(() => null);
        return json({ result: await embed.compute(request, body) });
      }

      return json({ error: `${request.method} is not allowed here.` }, 405);
    } catch (cause) {
      return errorResponse(cause);
    }
  };

  // Next.js and friends want a named export per method; both point here.
  return Object.assign(handler, { GET: handler, POST: handler });
}

/** Minimal shape of a Node/Express request; structural so no `@types/node` is needed. */
export interface NodeLikeRequest extends AsyncIterable<Uint8Array> {
  method?: string | undefined;
  url?: string | undefined;
  headers: Record<string, string | string[] | undefined>;
}

/** Minimal shape of a Node/Express response. */
export interface NodeLikeResponse {
  writeHead(status: number, headers: Record<string, string>): unknown;
  end(chunk?: string): unknown;
}

/**
 * Adapts a handler for `node:http` and Express, which predate Web `Request`.
 * Resolves false when the route isn't ours, so you can fall through:
 *
 *   if (await embed(req, res)) return;
 */
export function toNodeHandler(
  handler: EmbedHandler,
): (request: NodeLikeRequest, response: NodeLikeResponse) => Promise<boolean> {
  return async (request, response) => {
    const host = String(request.headers["host"] ?? "localhost");
    const proto = String(request.headers["x-forwarded-proto"] ?? "http").split(",")[0];
    const url = new URL(request.url ?? "/", `${proto}://${host}`);

    const headers = new Headers();
    for (const [key, value] of Object.entries(request.headers)) {
      if (typeof value === "string") headers.set(key, value);
    }

    const method = request.method ?? "GET";
    const init: RequestInit = { method, headers };
    if (method !== "GET" && method !== "HEAD") {
      // TextDecoder rather than Buffer, so this stays runtime-agnostic.
      const decoder = new TextDecoder();
      let body = "";
      for await (const chunk of request) body += decoder.decode(chunk, { stream: true });
      init.body = body + decoder.decode();
    }

    const result = await handler(new Request(url, init));
    if (!result) return false;

    const out: Record<string, string> = {};
    result.headers.forEach((value, key) => (out[key] = value));
    response.writeHead(result.status, out);
    response.end(await result.text());
    return true;
  };
}
