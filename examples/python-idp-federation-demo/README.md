# TextQL identity provider federation example (Python backend + React)

An internal tool that signs users in with your identity provider (Okta, Entra
ID, any OIDC IdP that TextQL also trusts) and chats with TextQL **as that
user** (their roles, connectors and chats) without a TextQL sign-in, an
approval screen, or an org-wide API key. The backend exchanges each user's ID
token for a TextQL access token
([RFC 8693 token exchange](https://datatracker.ietf.org/doc/html/rfc8693)).

It is the [`python-oauth-demo`](../python-oauth-demo) with the "Connect TextQL"
OAuth step replaced by that exchange. The chat UI and streaming backend are
unchanged.

| File | What it does |
|---|---|
| `backend/migrations/0001_init.sql` | The schema |
| `backend/app/db.py` | Opens `backend/app.db` and runs any migrations it hasn't seen |
| `backend/app/idp_login.py` | Sign in with the IdP (authorization code + PKCE, endpoints from OIDC discovery), the `sid` session cookie, IdP token refresh |
| `backend/app/textql_federation.py` | The exchange, renewing it, and the per-request TextQL client |

On the frontend, `frontend/src/components/AuthGate.tsx` shows "Sign in with
<`IDP_NAME`>", runs the exchange, then shows the chat.

## How it works

```
1. Sign in with the IdP   GET  /v3/auth/login             state + PKCE verifier + nonce -> 302 to the IdP
   back from the IdP      GET  /callback?code=&state=     code -> ID + access token -> users + idp_tokens rows, sid cookie
2. Exchange               POST /v3/auth/textql/exchange   exchange_token(access_token, ...) -> textql_tokens row
3. Chat                   /v3/textql/*                    bind_textql: this user's client
```

The exchange is one form post to TextQL's `/oauth/token`, which
`textql_sdk.oauth.exchange_token` sends:

```
grant_type=urn:ietf:params:oauth:grant-type:token-exchange
org_id=<TextQL org id>
subject_token=<the user's IdP access token>
subject_token_type=urn:ietf:params:oauth:token-type:access_token
```

TextQL accepts only access tokens, not ID tokens: ID tokens carry the app's
client ID as their audience and get copied into browsers and logs. The ID token
here only identifies the user at sign-in.

TextQL verifies the token against the IdP's keys, checks that the org trusts its
issuer and audience and that it wasn't issued to TextQL's own client, finds the
member that identity signed in as, and returns an access token with
`api:read api:write`. There is no TextQL refresh token, and the TextQL token
expires no later than the IdP access token.

So each user's `TokenManager` gets a `renew` callback instead of a refresh
token. When the TextQL token is under a minute from expiry, or a call comes back
401, `renew` takes a fresh IdP access token (refreshing it with the IdP's refresh
token when under five minutes are left) and exchanges again.

Only the IdP refresh needs a lock: it can rotate the refresh token, which is
single use. It runs alone in a short SQLite write transaction
(`BEGIN IMMEDIATE`) that re-reads the row and commits the rotated token before
TextQL is called, so two requests never spend the same one and a failed
exchange can't lose it. The exchange itself holds no lock; doing it twice just
mints two valid tokens.

Every renewal path ends the same way:

| What happened | Result |
|---|---|
| IdP refuses the refresh (`invalid_grant`) | Signed out everywhere; sign in again |
| TextQL refuses the exchange | 409 with TextQL's reason; the UI shows it and offers to retry |
| IdP or TextQL down, erroring or rate limiting | 503; stored tokens are kept for the next try |

## Setup

**1. The IdP: an authorization server and an app for this tool.** The access
tokens must come from an authorization server whose tokens third parties can
verify. In Okta that's a custom authorization server, such as the built-in
`https://<you>.okta.com/oauth2/default`, not the org server
`https://<you>.okta.com`, whose access tokens are only for Okta's own APIs. Its
access policy must allow this app.

Then an OIDC web app. In Okta: Applications > Create App Integration > OIDC,
Web Application:

- **Grant types:** Authorization Code and Refresh Token
- **Sign-in redirect URI:** `http://localhost:5175/callback`
- **Assignments:** the users who will test it

Use a different app from the one TextQL signs in with. TextQL refuses tokens
issued to its own client (Okta's `cid` claim) as "issued to TextQL".

**2. TextQL: trust it.** Under **Settings > Security > Authentication**, on the org's OIDC
provider. Its issuer URL must be the step 1 authorization server, the same as
`IDP_ISSUER` character for character: TextQL picks whom to trust by the token's
`iss`, so a provider on the org server won't match a `/oauth2/default` token. It
must be a provider added there, not one set by `OIDC_*` environment variables:
those can't turn on token exchange.

- turn on **Allow token exchange**
- add the authorization server's audience as an accepted audience: `api://default`
  on Okta's default server (its `aud` claim, not a client ID)

**3. Each test user signs in to TextQL through that provider.** That links their
IdP identity to their TextQL member, and the exchange also needs an active SSO
sign-in. Until then it fails with "no user has signed in with this identity" or
"user has no active SSO sign-in". Changing the provider's issuer means signing
in again. `@textql.com` accounts can't use token exchange.

**4. Configure:**

```sh
cp .env.example .env    # IDP_*, TEXTQL_SERVER_URL, TEXTQL_ORG_ID
```

**5. Backend** (Python 3.11). `exchange_token` is not on PyPI yet, so
`requirements.txt` installs the SDK from `main`:

```sh
cd backend
python3.11 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/uvicorn app.main:app --port 8787 --reload
```

**6. Frontend** (Node 24.16.0, pinned in `frontend/.nvmrc`), in a second terminal:

```sh
cd frontend
nvm use
npm install
npm run dev
```

Open http://localhost:5175 and sign in. Vite proxies `/v3` and
`/callback` to the backend, so the session cookie, the tokens and the IdP
client secret never leave the backend's origin.

## When the exchange is refused

The UI shows TextQL's `error_description` and the reason code. Once a token's
signature checks out against a trusted provider, TextQL also writes the refusal
to the org's audit log; earlier refusals (untrusted issuer, bad signature,
audience) are only in the server log.

| You see | Fix |
|---|---|
| `subject_token_type must be an access_token` | Send the IdP access token, not the ID token |
| `subject_token could not be verified` | Token exchange is off, the provider's issuer differs from `IDP_ISSUER` (org server vs `/oauth2/default`), or the token expired |
| `subject_token audience is not accepted` | Add the authorization server's audience (`api://default` on Okta's default server) |
| `subject_token was issued to TextQL, not to your integration` | `IDP_CLIENT_ID` is TextQL's own app; use a separate one |
| `no user has signed in with this identity` | Sign in to TextQL through that provider as that user |
| `user has no active SSO sign-in` | Sign in to TextQL through that provider again |
| `user is not a member of this organization` | Invite them, or check `TEXTQL_ORG_ID` |
| `this user cannot sign in by token exchange` | `@textql.com` accounts are excluded; test with another user |

## Things to change before using this for real

- **Encrypt the IdP `refresh_token` and `access_token` at rest.** The refresh token mints new access tokens, and so new TextQL access.
- **Serve over HTTPS** and add `secure=True` to the cookies in `idp_login.py`.
- **Verify the ID token** if it reaches you any other way than straight from the IdP's
  token endpoint. This app reads its claims without checking the signature
  because it did; TextQL checks the signature on every exchange.
- **Multiple backend processes** are fine on one SQLite file (`BEGIN IMMEDIATE` is a
  file lock). On Postgres, use `SELECT ... FOR UPDATE` on the user's `idp_tokens` row instead.
- **Sign-out** only ends this app's session. Add the IdP's `end_session_endpoint` to
  sign out there too; a TextQL token already issued keeps working until it expires.
