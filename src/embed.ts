/**
 * Embed a Data App in your own web app. See EMBED.md.
 *
 * Pair with `@textql/sdk/embed/element`, which registers the `<textql-app>`
 * element that calls these routes.
 */
import { stringFromBase64 } from "./lib/base64.js";
import { readEnv } from "./env-config.js";
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

/** One entry from the list route. `ListApps` returns no compute functions. */
export interface EmbedAppSummary {
  id: string;
  name: string;
  screenshotUrl: string | null;
}

export interface EmbedOptions {
  /**
   * The app to serve. Defaults to `TEXTQL_APP_ID`. A function picks per request.
   * With a `basePath` placeholder and `appIds`, leave this unset.
   */
  appId?:
    | string
    | ((request: Request, params: Record<string, string>) => string | Promise<string>)
    | undefined;
  /**
   * The apps this handler serves. Turns on the list route, and is the allowlist
   * a `basePath` placeholder is checked against. The API key is org-wide, so
   * without it a placeholder would render any app in the org.
   */
  appIds?:
    | readonly string[]
    | ((request: Request) => readonly string[] | Promise<readonly string[]>)
    | undefined;
  /**
   * Drop apps the key's own member authored from the list route, by `creator_id`.
   * Not `ListApps`' `shared_with_me`, which also demands an explicit grant and so
   * returns nothing for role-derived access. Still the key's member, not your end
   * user — for that, pass a function to `appIds`.
   */
  excludeOwn?: boolean | undefined;
  /**
   * The key's member, for `excludeOwn`. Parsed from `TEXTQL_API_KEY` when
   * omitted; set it for a key that is not `base64("<member_id>:<token>")`.
   */
  memberId?: string | undefined;
  /** Defaults to a client built from `TEXTQL_API_KEY` / `TEXTQL_SERVER_URL`. */
  client?: Textql | undefined;
  /**
   * Where the handler is mounted. Must match the element's `api-base`. A `:name`
   * segment captures that path part, so one handler serves many apps; the list
   * route then sits on the static part above it.
   */
  basePath?: string | undefined;
  /**
   * Called before every request; return false or throw to reject. Nothing else
   * here knows who the caller is, so without it the routes are open.
   */
  authorize?: (request: Request) => boolean | Promise<boolean>;
  /**
   * Serve the app document from your origin. On by default: a published app is
   * pinned to its publish origin and will not frame anywhere else.
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

/** As written by compute's `pkg/app/shell.go`; `document` fails loudly if it drifts. */
const PUBLISHED_CONFIG =
  /<script>window\.ANA_RUNTIME_CONFIG\s*=\s*\{[^}]*\};?<\/script>/;

/** Keys are `base64("<member_id>:<token>")`. `null` for anything else, such as an embed JWT. */
function memberIdFromApiKey(apiKey: string | undefined): string | null {
  if (!apiKey) return null;
  try {
    const [memberId, token] = stringFromBase64(apiKey.trim()).split(":", 2);
    return memberId && token ? memberId : null;
  } catch {
    return null;
  }
}

function envAppId(): string {
  const value = readEnv("TEXTQL_APP_ID");
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

/** `ListApps` caps `limit` server-side; asking for more than this wastes a field. */
const LIST_PAGE_SIZE = 100;

/** Fan-out for both list strategies: a few requests at a time, never all at once. */
const LIST_CONCURRENCY = 4;

/** "Not this app", as opposed to "the request failed" — the latter must stay loud. */
const MISSING_APP_STATUSES = new Set([400, 403, 404]);

function isMissingApp(cause: unknown): boolean {
  const status = cause instanceof EmbedError
    ? cause.status
    : (cause as { statusCode?: unknown })?.statusCode;
  return typeof status === "number" && MISSING_APP_STATUSES.has(status);
}

/** Bounds the walk if `totalCount` ever comes back implausible. 100k apps. */
const LIST_MAX_PAGES = 1000;

/** The trailing route name, and whatever the `basePath` placeholders captured. */
interface RouteMatch {
  route: string;
  params: Record<string, string>;
}

class Embed {
  readonly basePath: string;
  /** Where the list route answers: the `basePath` up to its first placeholder. */
  readonly listPath: string;
  private readonly segments: string[];
  private readonly options: EmbedOptions;
  private client: Textql | undefined;

  constructor(options: EmbedOptions) {
    this.options = options;
    this.basePath = (options.basePath ?? DEFAULT_BASE_PATH).replace(/\/+$/, "");
    this.segments = this.basePath.split("/");

    const placeholder = this.segments.findIndex((segment) => segment.startsWith(":"));
    this.listPath = placeholder === -1
      ? this.basePath
      : this.segments.slice(0, placeholder).join("/");
  }

  /** `excludeOwn: false` only declines to filter, so it never creates a list. */
  get listable(): boolean {
    return !!this.options.appIds || this.options.excludeOwn === true;
  }

  /** `null` unless the path is the base path plus exactly one segment: the route name. */
  match(pathname: string): RouteMatch | null {
    const parts = pathname.split("/");
    if (parts.length !== this.segments.length + 1) return null;

    const params: Record<string, string> = {};
    for (const [index, segment] of this.segments.entries()) {
      const value = parts[index] ?? "";
      if (!segment.startsWith(":")) {
        if (segment !== value) return null;
        continue;
      }
      if (!value) return null;
      params[segment.slice(1)] = decodeURIComponent(value);
    }

    return { route: parts[this.segments.length] ?? "", params };
  }

  private sdk(): Textql {
    // Lazy, so a missing key is a 503 on first request, not a throw at import.
    this.client ??= this.options.client ?? new Textql();
    return this.client;
  }

  private async allowedIds(request: Request): Promise<readonly string[] | null> {
    const configured = this.options.appIds;
    if (!configured) return null;
    return typeof configured === "function" ? configured(request) : configured;
  }

  private async appId(request: Request, pathParams: Record<string, string>): Promise<string> {
    const configured = this.options.appId;
    if (typeof configured === "function") return configured(request, pathParams);
    if (configured) return configured;

    const captured = Object.values(pathParams);
    if (!captured.length) return envAppId();
    if (captured.length > 1) {
      throw new EmbedError(
        500,
        "More than one basePath placeholder needs an `appId` resolver to say which is the app.",
      );
    }

    // Taking the segment on trust makes the route an oracle for the whole org.
    const allowed = await this.allowedIds(request);
    if (!allowed) {
      throw new EmbedError(
        500,
        "A basePath placeholder needs `appIds` to check it against, or an `appId` resolver.",
      );
    }

    const appId = captured[0] ?? "";
    if (!allowed.includes(appId)) throw new EmbedError(404, "That app does not exist.");
    return appId;
  }

  private async fetchApp(
    request: Request,
    pathParams: Record<string, string>,
  ): Promise<TextqlRpcPublicAppApp> {
    const appId = await this.appId(request, pathParams);
    const result = unwrap(
      await this.sdk().apps.get({ body: { appId } }),
      "Unable to load the app.",
    );
    const app = result.app;
    if (!app) throw new EmbedError(404, "That app does not exist.");
    return app;
  }

  async meta(request: Request, pathParams: Record<string, string>): Promise<EmbedAppMeta> {
    return toMeta(await this.fetchApp(request, pathParams));
  }

  private async listPage(page: number) {
    return unwrap(
      await this.sdk().apps.list({
        body: { limit: LIST_PAGE_SIZE, offset: page * LIST_PAGE_SIZE },
      }),
      "Unable to list the apps.",
    );
  }

  /** Only resolved when `excludeOwn` is on; other key shapes are fine otherwise. */
  private ownMemberId(): string {
    const configured = this.options.memberId?.trim();
    if (configured) return configured;

    const memberId = memberIdFromApiKey(readEnv("TEXTQL_API_KEY"));
    if (!memberId) {
      throw new EmbedError(
        500,
        "`excludeOwn` needs to know the key's member: set `memberId`, or use a TEXTQL_API_KEY of the form base64(\"<member_id>:<token>\").",
      );
    }
    return memberId;
  }

  /**
   * One app at a time. `ListApps` cannot filter by id, so walking it for a known
   * handful costs the whole org. Unreadable ids drop out; naming them back is
   * what `appIds` exists to prevent.
   */
  private async fetchEach(appIds: readonly string[]): Promise<TextqlRpcPublicAppApp[]> {
    const found: TextqlRpcPublicAppApp[] = [];

    for (let index = 0; index < appIds.length; index += LIST_CONCURRENCY) {
      const batch = appIds.slice(index, index + LIST_CONCURRENCY).map(async (appId) => {
        try {
          const result = unwrap(
            await this.sdk().apps.get({ body: { appId } }),
            "Unable to load the app.",
          );
          return result.app ?? null;
        } catch (cause) {
          if (isMissingApp(cause)) return null;
          throw cause;
        }
      });

      for (const app of await Promise.all(batch)) {
        if (app) found.push(app);
      }
    }

    return found;
  }

  /**
   * Every app the key can see, for when there is no allowlist to look up. The
   * first page carries `totalCount`, so the rest go out together.
   */
  private async walkAll(): Promise<TextqlRpcPublicAppApp[]> {
    const first = await this.listPage(0);
    const all: TextqlRpcPublicAppApp[] = [...(first.apps ?? [])];

    const pages = Math.min(
      Math.ceil((first.totalCount ?? 0) / LIST_PAGE_SIZE),
      LIST_MAX_PAGES,
    );

    for (let page = 1; page < pages; page += LIST_CONCURRENCY) {
      const batch = [];
      for (let n = page; n < Math.min(page + LIST_CONCURRENCY, pages); n++) {
        batch.push(this.listPage(n));
      }
      for (const result of await Promise.all(batch)) all.push(...(result.apps ?? []));
    }

    return all;
  }

  /** What the list route returns: allowlist order, or the server's when there is none. */
  async list(request: Request): Promise<EmbedAppSummary[]> {
    const allowed = await this.allowedIds(request);
    const own = this.options.excludeOwn ? this.ownMemberId() : null;

    const apps = allowed
      ? await this.fetchEach([...new Set(allowed)])
      : await this.walkAll();

    // Keyed by id because offset paging can repeat a row that moved between pages.
    const found = new Map<string, EmbedAppSummary>();
    for (const app of apps) {
      const id = app.id;
      if (!id || (own && app.creatorId === own)) continue;
      const { name, screenshotUrl } = toMeta(app);
      found.set(id, { id, name, screenshotUrl });
    }

    return [...found.values()];
  }

  /** The signed, expiring CDN URL. Only used when rehosting is off. */
  async documentUrl(request: Request, pathParams: Record<string, string>): Promise<string> {
    const app = await this.fetchApp(request, pathParams);
    if (!app.htmlUrl) throw new EmbedError(404, "That app has not been rendered yet.");
    return app.htmlUrl;
  }

  /**
   * A published app is pinned to one origin twice: `frame-ancestors`
   * (`pkg/remote/proxy/assets.go`) stops it framing, and a baked-in
   * `ANA_RUNTIME_CONFIG.hostOrigin` (`pkg/app/shell.go`) is the only origin its
   * runtime will postMessage. Serving it here clears the first, rewriting the
   * config clears the second, and `<base href>` keeps subresources on the CDN.
   */
  async document(
    request: Request,
    pathParams: Record<string, string>,
    hostOrigin: string,
  ): Promise<string> {
    const app = await this.fetchApp(request, pathParams);
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

  async compute(
    request: Request,
    pathParams: Record<string, string>,
    body: unknown,
  ): Promise<unknown> {
    const name = (body as { name?: unknown } | null)?.name;
    const params = (body as { params?: unknown } | null)?.params;
    if (typeof name !== "string" || !name) {
      throw new EmbedError(400, "Expected a JSON body of { name, params }.");
    }

    // The iframe can post any name it likes; without this the route is a
    // generic runner for anything the org's key can reach.
    const app = await this.fetchApp(request, pathParams);
    if (!toMeta(app).functions.includes(name)) {
      throw new EmbedError(403, `${name} is not a compute function of this app.`);
    }

    const result = unwrap(
      await this.sdk().apps.invokeComputeFunction({
        body: {
          appId: app.id ?? (await this.appId(request, pathParams)),
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

/** Failures arrive as a `{ code, message }` body on the error. Read structurally. */
function upstreamMessage(cause: unknown): string | null {
  const body = (cause as { body?: unknown })?.body;
  if (typeof body !== "string") return null;
  try {
    const { message } = JSON.parse(body) as { message?: unknown };
    return typeof message === "string" && message ? message : null;
  } catch {
    return null;
  }
}

function errorResponse(cause: unknown): Response {
  if (cause instanceof EmbedError) return json({ error: cause.message }, cause.status);
  const status = (cause as { statusCode?: unknown })?.statusCode;
  if (typeof status === "number") {
    // The status alone is undebuggable — a compute call that raised inside the
    // app is a bare 400, and the traceback naming the bad argument is in the
    // message. Platform strings, so they reach the browser as-is.
    return json({ error: upstreamMessage(cause) ?? `TextQL returned ${status}.` }, status);
  }
  return json({ error: "The embed request failed." }, 500);
}

const ROUTES = new Set(["app", "document", "compute"]);

/**
 * Handles the routes `<textql-app>` calls, under `basePath`:
 *
 *   GET  {basePath}/app       → { name, screenshotUrl, functions }
 *   GET  {basePath}/document  → the app's HTML, served from your origin
 *   POST {basePath}/compute   → { result }
 *
 * With `appIds` set, one more, on the static part of `basePath`:
 *
 *   GET  {listPath}           → [{ id, name, screenshotUrl }]
 *
 * Returns `null` for anything else, so it composes with your own routing.
 */
export function createEmbedHandler(
  options: EmbedOptions = {},
): EmbedHandler & { GET: EmbedHandler; POST: EmbedHandler } {
  const embed = new Embed(options);

  // The list is behind `authorize` too — it names the apps.
  const guarded = async (request: Request, run: () => Promise<Response>): Promise<Response> => {
    try {
      if (options.authorize && (await options.authorize(request)) === false) {
        throw new EmbedError(403, "Not allowed to view this app.");
      }
      return await run();
    } catch (cause) {
      return errorResponse(cause);
    }
  };

  const serve = async (
    request: Request,
    { route, params: pathParams }: RouteMatch,
  ): Promise<Response> => {
    if (route === "app" && request.method === "GET") {
      return json(await embed.meta(request, pathParams));
    }

    if (route === "document" && request.method === "GET") {
      if (options.rehostDocument === false) {
        return Response.redirect(await embed.documentUrl(request, pathParams), 302);
      }
      const html = await embed.document(request, pathParams, new URL(request.url).origin);
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

    if (route === "compute" && request.method === "POST") {
      const body = await request.json().catch(() => null);
      return json({ result: await embed.compute(request, pathParams, body) });
    }

    return json({ error: `${request.method} is not allowed here.` }, 405);
  };

  const handler: EmbedHandler = async (request) => {
    const pathname = new URL(request.url).pathname.replace(/\/+$/, "");

    const matched = embed.match(pathname);
    if (matched) {
      if (!ROUTES.has(matched.route)) return null;
      return guarded(request, () => serve(request, matched));
    }

    if (embed.listable && pathname === embed.listPath) {
      if (request.method !== "GET") {
        return json({ error: `${request.method} is not allowed here.` }, 405);
      }
      return guarded(request, async () => json(await embed.list(request)));
    }

    return null;
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
