// OAuth access/refresh token auth. Hand-written, not produced by Speakeasy: the
// generated `apiKey` option can only send `tql_api_key`, so token auth is
// injected under the SDK as a custom fetcher.
import { serverURLFromEnv } from "./env-config.js";
import { stringFromBase64 } from "./lib/base64.js";
import { type SDKOptions, ServerList } from "./lib/config.js";
import { type Fetcher, HTTPClient } from "./lib/http.js";
import type { ClientSDK } from "./lib/sdks.js";
import { Textql } from "./sdk/sdk.js";

const REFRESH_MARGIN_MS = 60_000;

export interface OAuthTokens {
  accessToken: string;
  refreshToken?: string | undefined;
  /** Epoch milliseconds the access token expires. Unset refreshes only on a 401. */
  expiresAt?: number | undefined;
}

export interface TokenManagerOptions {
  accessToken: string;
  refreshToken?: string | undefined;
  clientId?: string | undefined;
  clientSecret?: string | undefined;
  /** Seconds until the access token expires, as returned by `/oauth/token`. */
  expiresIn?: number | undefined;
  /** Epoch milliseconds; takes precedence over `expiresIn`. */
  expiresAt?: number | undefined;
  /**
   * Receives every refreshed pair. Refresh tokens are single use, so persist
   * the new one: the previous refresh token is rejected from now on.
   */
  onTokens?: ((tokens: OAuthTokens) => void | Promise<void>) | undefined;
  /** Used to derive `tokenURL`. Defaults to `TEXTQL_SERVER_URL`, then the SDK default. */
  serverURL?: string | undefined;
  /** Defaults to `<server origin>/oauth/token`. */
  tokenURL?: string | undefined;
  fetch?: typeof globalThis.fetch | undefined;
}

export class OAuthRefreshError extends Error {
  constructor(
    readonly status: number,
    readonly error: string,
    readonly description?: string | undefined,
  ) {
    super(`token refresh failed (${status} ${error})${description ? `: ${description}` : ""}`);
    this.name = "OAuthRefreshError";
  }
}

function serverOrigin(serverURL: string | undefined): string {
  return new URL(serverURL ?? serverURLFromEnv() ?? ServerList[0]).origin;
}

function defaultTokenURL(serverURL: string | undefined): string {
  return `${serverOrigin(serverURL)}/oauth/token`;
}

async function postToken(
  tokenURL: string,
  form: URLSearchParams,
  fetcher: typeof globalThis.fetch | undefined,
  previousRefreshToken?: string,
): Promise<OAuthTokens> {
  const response = await (fetcher ?? globalThis.fetch)(tokenURL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: form,
  });
  const body = await response.json().catch(() => ({})) as Record<string, unknown>;
  const accessToken = body["access_token"];
  if (!response.ok || typeof accessToken !== "string") {
    throw new OAuthRefreshError(
      response.status,
      typeof body["error"] === "string" ? body["error"] : "invalid_response",
      typeof body["error_description"] === "string" ? body["error_description"] : undefined,
    );
  }
  const expiresIn = body["expires_in"];
  return {
    accessToken,
    refreshToken: typeof body["refresh_token"] === "string" ? body["refresh_token"] : previousRefreshToken,
    expiresAt: typeof expiresIn === "number" ? Date.now() + expiresIn * 1000 : undefined,
  };
}

function base64url(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export interface AuthorizationRequest {
  /** Send the user's browser here to sign in and approve the app. */
  url: string;
  /** Compare with the `state` query param on the redirect before exchanging. */
  state: string;
  /** Keep server-side until the redirect; `exchangeCode` needs it. */
  codeVerifier: string;
}

export interface AuthorizationURLOptions {
  clientId: string;
  /** Must be registered on the OAuth application. */
  redirectURI: string;
  /** Defaults to every scope the application was registered with. SDK calls need `api:read`. */
  scopes?: string[] | undefined;
  state?: string | undefined;
  serverURL?: string | undefined;
}

/** Start the authorization code + PKCE login for one user. */
export async function authorizationURL(options: AuthorizationURLOptions): Promise<AuthorizationRequest> {
  const codeVerifier = base64url(crypto.getRandomValues(new Uint8Array(48)));
  const challenge = base64url(
    new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(codeVerifier))),
  );
  const state = options.state ?? base64url(crypto.getRandomValues(new Uint8Array(18)));
  const params = new URLSearchParams({
    response_type: "code",
    client_id: options.clientId,
    redirect_uri: options.redirectURI,
    code_challenge: challenge,
    code_challenge_method: "S256",
    state,
  });
  if (options.scopes?.length) params.set("scope", options.scopes.join(" "));
  return {
    url: `${serverOrigin(options.serverURL)}/oauth/authorize?${params}`,
    state,
    codeVerifier,
  };
}

export interface ExchangeCodeOptions {
  code: string;
  clientId: string;
  clientSecret: string;
  redirectURI: string;
  codeVerifier: string;
  serverURL?: string | undefined;
  tokenURL?: string | undefined;
  fetch?: typeof globalThis.fetch | undefined;
}

/** Exchange the `code` from the redirect for the user's token pair. */
export function exchangeCode(options: ExchangeCodeOptions): Promise<OAuthTokens> {
  return postToken(
    options.tokenURL ?? defaultTokenURL(options.serverURL),
    new URLSearchParams({
      grant_type: "authorization_code",
      code: options.code,
      client_id: options.clientId,
      client_secret: options.clientSecret,
      redirect_uri: options.redirectURI,
      code_verifier: options.codeVerifier,
    }),
    options.fetch,
  );
}

/**
 * Holds an OAuth token pair and refreshes it against `/oauth/token`. Concurrent
 * callers share one in-flight refresh, so a rotated refresh token is never
 * replayed. Share one manager between everything using the same grant.
 */
export class TokenManager {
  #tokens: OAuthTokens;
  #refreshing: Promise<void> | null = null;
  readonly #clientId: string | undefined;
  readonly #clientSecret: string | undefined;
  readonly #onTokens: TokenManagerOptions["onTokens"];
  readonly #tokenURL: string;
  readonly #fetch: typeof globalThis.fetch | undefined;

  constructor(options: TokenManagerOptions) {
    if (options.refreshToken && !options.clientId) {
      throw new Error("clientId is required to refresh tokens");
    }
    this.#tokens = {
      accessToken: options.accessToken,
      refreshToken: options.refreshToken,
      expiresAt: options.expiresAt
        ?? (options.expiresIn != null ? Date.now() + options.expiresIn * 1000 : undefined),
    };
    this.#clientId = options.clientId;
    this.#clientSecret = options.clientSecret;
    this.#onTokens = options.onTokens;
    this.#tokenURL = options.tokenURL ?? defaultTokenURL(options.serverURL);
    this.#fetch = options.fetch;
  }

  get tokens(): OAuthTokens {
    return this.#tokens;
  }

  get canRefresh(): boolean {
    return !!this.#tokens.refreshToken;
  }

  /**
   * A usable access token, refreshing first when the current one is near expiry
   * or equals `stale` (a token the server just rejected).
   */
  async accessToken(stale?: string): Promise<string> {
    if (!this.#usable(stale) && this.canRefresh) {
      if (!this.#refreshing) {
        this.#refreshing = this.#refresh().finally(() => {
          this.#refreshing = null;
        });
      }
      await this.#refreshing;
    }
    return this.#tokens.accessToken;
  }

  /** The `member_id` claim of the current access token, if it has one. */
  memberId(): string | null {
    const payload = this.#tokens.accessToken.split(".")[1];
    if (!payload) return null;
    try {
      const b64 = payload.replace(/-/g, "+").replace(/_/g, "/");
      const claims = JSON.parse(stringFromBase64(b64.padEnd(Math.ceil(b64.length / 4) * 4, "=")));
      return typeof claims.member_id === "string" && claims.member_id ? claims.member_id : null;
    } catch {
      return null;
    }
  }

  #usable(stale: string | undefined): boolean {
    const { accessToken, expiresAt } = this.#tokens;
    if (stale !== undefined && accessToken === stale) return false;
    return expiresAt == null || Date.now() < expiresAt - REFRESH_MARGIN_MS;
  }

  async #refresh(): Promise<void> {
    const refreshToken = this.#tokens.refreshToken!;
    const form = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: this.#clientId ?? "",
    });
    if (this.#clientSecret) form.set("client_secret", this.#clientSecret);

    this.#tokens = await postToken(this.#tokenURL, form, this.#fetch, refreshToken);
    await this.#onTokens?.(this.#tokens);
  }
}

function authorize(request: Request, token: string): Request {
  const headers = new Headers(request.headers);
  // The server prefers tql_api_key over a Bearer token, and the SDK fills it
  // from TEXTQL_API_KEY whenever that is set.
  headers.delete("tql_api_key");
  headers.set("authorization", `Bearer ${token}`);
  return new Request(request, { headers });
}

/**
 * A fetcher that sends the manager's access token as a Bearer token and, on a
 * 401, refreshes it and replays the request once.
 */
export function createTokenFetcher(manager: TokenManager, inner?: Fetcher): Fetcher {
  const send: Fetcher = inner ?? ((input, init) => (init == null ? fetch(input) : fetch(input, init)));
  return async (input, init) => {
    const request = new Request(input, init);
    const replay = manager.canRefresh ? request.clone() : null;
    const token = await manager.accessToken();
    const response = await send(authorize(request, token));
    if (response.status !== 401 || !replay) return response;

    await response.body?.cancel();
    return send(authorize(replay, await manager.accessToken(token)));
  };
}

const managers = new WeakMap<HTTPClient, TokenManager>();

/** An `HTTPClient` for `new Textql({ httpClient })` that authenticates with tokens. */
export function createTokenHTTPClient(manager: TokenManager, inner?: Fetcher): HTTPClient {
  const client = new HTTPClient({ fetcher: createTokenFetcher(manager, inner) });
  managers.set(client, manager);
  return client;
}

/** The token manager behind an SDK built by `fromTokens` or `createTokenHTTPClient`. */
export function tokenManagerOf(sdk: ClientSDK): TokenManager | null {
  const client = sdk._options.httpClient;
  return client ? managers.get(client) ?? null : null;
}

export type FromTokensOptions =
  & Omit<SDKOptions, "apiKey" | "httpClient">
  & (
    | (Omit<TokenManagerOptions, "serverURL"> & { manager?: undefined })
    | { manager: TokenManager }
  );

/**
 * A `Textql` client authenticated with an OAuth token pair instead of an API key.
 *
 * ```ts
 * const textql = fromTokens({
 *   accessToken, refreshToken, clientId, clientSecret, expiresIn: 3600,
 *   onTokens: (tokens) => store.save(tokens),
 * });
 * ```
 */
export function fromTokens(options: FromTokensOptions): Textql {
  const {
    manager: given,
    accessToken,
    refreshToken,
    clientId,
    clientSecret,
    expiresIn,
    expiresAt,
    onTokens,
    tokenURL,
    fetch: tokenFetch,
    ...sdkOptions
  } = options as Omit<SDKOptions, "apiKey" | "httpClient"> & Partial<TokenManagerOptions> & { manager?: TokenManager };

  const manager = given ?? new TokenManager({
    accessToken: accessToken!,
    refreshToken,
    clientId,
    clientSecret,
    expiresIn,
    expiresAt,
    onTokens,
    tokenURL,
    fetch: tokenFetch,
    serverURL: sdkOptions.serverURL,
  });
  return new Textql({ ...sdkOptions, httpClient: createTokenHTTPClient(manager, tokenFetch) });
}
