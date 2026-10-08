# OAuth access and refresh tokens

`@textql/sdk/oauth` lets the SDK authenticate the way first-party client apps
do: with an OAuth access token sent as `Authorization: Bearer`, refreshed with a
refresh token. It is hand-written and lives outside the generated surface,
because the generated `apiKey` option can only send `tql_api_key`.

## Signing users in

Register an OAuth application under **Settings > Security** with your tool's
redirect URI and the `api:read` scope (plus `api:write` to change anything). An
application with only `mcp:tools` gets tokens the SDK cannot use. Each user must
already be a member of the organization.

Then run the authorization code + PKCE flow once per user:

```typescript
import { authorizationURL, exchangeCode } from "@textql/sdk/oauth";

// 1. Login route: remember state and codeVerifier in the user's session.
const req = await authorizationURL({ clientId, redirectURI, scopes: ["api:read", "api:write"] });
session.oauth = { state: req.state, codeVerifier: req.codeVerifier };
return Response.redirect(req.url);

// 2. Callback route: the user signed in and approved the app.
const params = new URL(request.url).searchParams;
if (params.get("state") !== session.oauth.state) return new Response(null, { status: 400 });
const tokens = await exchangeCode({
  code: params.get("code")!,
  clientId,
  clientSecret,
  redirectURI,
  codeVerifier: session.oauth.codeVerifier,
});
await store.save(user, tokens);
```

## Usage

```typescript
import { fromTokens } from "@textql/sdk/oauth";

const textql = fromTokens({
  accessToken: stored.accessToken,
  refreshToken: stored.refreshToken,
  clientId: process.env.TEXTQL_OAUTH_CLIENT_ID!,
  clientSecret: process.env.TEXTQL_OAUTH_CLIENT_SECRET!,
  expiresAt: stored.expiresAt, // or expiresIn: 3600 straight from /oauth/token
  onTokens: (tokens) => store.save(tokens),
  serverURL: "https://app.textql.com", // optional, same as new Textql({ serverURL })
});

await textql.chats.createChat({ body: { message: "hi" } });
```

Every request gets a valid access token:

- The token is refreshed 60 seconds before `expiresAt`. Without an expiry it is
  refreshed only when the server answers 401.
- A 401 triggers one refresh and one replay of the same request.
- Refreshes call `POST <server origin>/oauth/token` with
  `grant_type=refresh_token`. Pass `tokenURL` to override it.

Any other `Textql` option (`retryConfig`, `timeoutMs`, `debugLogger`, ...) can be
passed alongside the token fields.

## Persist every refresh

Refresh tokens are single use. Each refresh returns a new refresh token and the
server rejects the old one with `invalid_grant`. Save the pair handed to
`onTokens` every time, or the next process start fails to refresh.

One `TokenManager` shares a single in-flight refresh between concurrent calls,
so share it instead of building one per client:

```typescript
import { TokenManager, fromTokens } from "@textql/sdk/oauth";

const manager = new TokenManager({ accessToken, refreshToken, clientId, clientSecret, onTokens });
const a = fromTokens({ manager });
const b = fromTokens({ manager, timeoutMs: 5_000 });
```

Separate processes sharing one grant must coordinate their refreshes themselves.

## Custom fetch

`fetch` on `fromTokens` is used for both API requests and refreshes. To compose
with your own `HTTPClient` setup, build the fetcher directly:

```typescript
import { Textql } from "@textql/sdk";
import { createTokenHTTPClient } from "@textql/sdk/oauth";

const textql = new Textql({ httpClient: createTokenHTTPClient(manager, myFetch) });
```

The fetcher removes any `tql_api_key` header, including one filled from
`TEXTQL_API_KEY`, because the server prefers an API key over a Bearer token.

## Streaming

`createStreamingClient(textql)` picks up the token manager from a client built
this way, or takes one directly with `{ tokens: manager }`. Unary calls are
replayed once after a 401. A stream cannot be replayed, so its `Unauthenticated`
error still reaches the caller, and the refreshed token is used on the next call.

## Errors

A failed refresh throws `OAuthRefreshError` with the HTTP `status` and the OAuth
`error` (`invalid_grant` for an expired, revoked or already used refresh token,
`invalid_client` for bad client credentials). The user has to sign in again to
get a new pair.

## Server requirements

- The access token must carry a public API scope. Tokens issued only for MCP
  (`mcp:tools`) are rejected.
- Bearer tokens work on every `/rpc/public` Connect RPC this SDK calls. The
  `/v2` REST API and the `/rpc/public/chat/stream` SSE endpoint do not accept
  them.
- Refreshing requires the OAuth client secret, so use this server-side only,
  never in a browser bundle.
