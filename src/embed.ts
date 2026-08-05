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

/**
 * One entry from the list route. No `functions`: `ListApps` does not populate
 * them, and an empty array here would read as "this app has none".
 */
export interface EmbedAppSummary {
  id: string;
  name: string;
  screenshotUrl: string | null;
}

export interface EmbedOptions {
  /**
   * The app to serve. Defaults to `TEXTQL_APP_ID`. Pass a function to pick per
   * request — from your session, a tenant header, a `basePath` placeholder.
   *
   * With a placeholder and `appIds` set, leave this alone: the captured segment
   * is checked against `appIds` and used as the app.
   */
  appId?:
    | string
    | ((request: Request, params: Record<string, string>) => string | Promise<string>)
    | undefined;
  /**
   * The apps this handler will serve, which turns on the list route. Also the
   * allowlist a `basePath` placeholder is checked against — the API key is
   * org-wide, so without it a placeholder renders *any* app in the org.
   */
  appIds?:
    | readonly string[]
    | ((request: Request) => readonly string[] | Promise<readonly string[]>)
    | undefined;
  /**
   * Passed to `ListApps` by the list route. Read the semantics before reaching
   * for it: it is *exclusive*, not additive — `true` returns only apps authored
   * by someone else and explicitly granted to you, and leaving it unset already
   * includes apps shared with you.
   *
   * "You" is the member who created the API key, never your end user, so this
   * cannot answer "what may this visitor see". That is what `appIds` as a
   * function is for. A member who reaches every app through a role rather than
   * a grant — an admin, typically — gets an empty list from `true`.
   */
  sharedWithMe?: boolean | undefined;
  /** Defaults to a client built from `TEXTQL_API_KEY` / `TEXTQL_SERVER_URL`. */
  client?: Textql | undefined;
  /**
   * Where the handler is mounted. Must match the element's `api-base`.
   *
   * A `:name` segment captures that part of the path, so one handler can serve
   * many apps — `/api/textql/:appId` matches `/api/textql/<id>/app`. The list
   * route then sits on the static part above it, at `/api/textql`.
   */
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

/** `ListApps` caps `limit` server-side, so asking for more than this wastes a field. */
const LIST_PAGE_SIZE = 100;

/** A page short of `LIST_PAGE_SIZE` ends the walk; this only bounds a server that never sends one. */
const LIST_MAX_PAGES = 100;

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

  /**
   * `appIds` means "there is a list here"; so does asking for the shared ones.
   * `sharedWithMe: false` is only a decision not to filter, so it never creates
   * a list on its own — that way `sharedWithMe: someBoolean` is safe to pass.
   *
   * `sharedWithMe` alone gives a read-only view: serving one of those apps
   * still needs `appIds` or an `appId` resolver to check the path against.
   */
  get listable(): boolean {
    return !!this.options.appIds || this.options.sharedWithMe === true;
  }

  /**
   * `null` when the path is not one of ours. Requires exactly one segment past
   * the base path, which is the route name — `/app`, `/document`, `/compute`.
   */
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
    // Built lazily so a missing key surfaces as a 503 on the first request
    // rather than a throw at import time. `TEXTQL_SERVER_URL` is applied by
    // the SDK init hook, so a bare client already points on-prem.
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

    // Taking the segment on trust would make this route an oracle for the whole
    // org: one org-wide key, and the path as the only gate.
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

  /**
   * The apps behind `appIds`, as the list route returns them.
   *
   * `ListApps` has no filter by id, so this walks the org a page at a time and
   * keeps the ones asked for. Ids the key cannot see are simply absent —
   * reporting them back would tell the browser they exist.
   */
  async list(request: Request): Promise<EmbedAppSummary[]> {
    const allowed = await this.allowedIds(request);
    const wanted = allowed && new Set(allowed);
    const found = new Map<string, EmbedAppSummary>();

    for (let page = 0; page < LIST_MAX_PAGES; page++) {
      const result = unwrap(
        await this.sdk().apps.list({
          body: {
            limit: LIST_PAGE_SIZE,
            offset: page * LIST_PAGE_SIZE,
            sharedWithMe: this.options.sharedWithMe,
          },
        }),
        "Unable to list the apps.",
      );

      const apps = result.apps ?? [];
      for (const app of apps) {
        const id = app.id;
        if (!id || (wanted && !wanted.has(id))) continue;
        const { name, screenshotUrl } = toMeta(app);
        found.set(id, { id, name, screenshotUrl });
      }

      if (apps.length < LIST_PAGE_SIZE) break;
      if (wanted && found.size === wanted.size) break;
    }

    // Returned in the order they were asked for rather than the server's
    // favourites-then-recency order, so a fixed `appIds` gives a fixed list.
    if (!allowed) return [...found.values()];
    return allowed
      .map((id) => found.get(id))
      .filter((app): app is EmbedAppSummary => !!app);
  }

  /** The signed, expiring CDN URL. Only used when rehosting is off. */
  async documentUrl(request: Request, pathParams: Record<string, string>): Promise<string> {
    const app = await this.fetchApp(request, pathParams);
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

/**
 * The platform reports failures as a JSON body — `{ code, message }` — carried
 * on the thrown error. Read structurally so this needs no error-class import.
 */
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
  // The SDK throws on non-2xx rather than returning the union, so a bad key is
  // a 401 here, not an opaque 500.
  if (typeof status === "number") {
    // The status alone is undebuggable: a compute call that raised inside the
    // app is a bare 400, and the Python traceback naming the bad argument —
    // the entire diagnosis — is in this message. These are the platform's
    // developer-facing strings, so they reach the browser as-is.
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

  // Every route is behind `authorize`, the list included: it names the apps.
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
