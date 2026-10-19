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
   back from the IdP      GET  /callback?code=&state=     code -> ID token -> users + idp_tokens rows, sid cookie
2. Exchange               POST /v3/auth/textql/exchange   exchange_token(id_token, org_id=...) -> textql_tokens row
3. Chat                   /v3/textql/*                    bind_textql: this user's client
```

The exchange is one form post to TextQL's `/oauth/token`, which
`textql_sdk.oauth.exchange_token` sends:

```
grant_type=urn:ietf:params:oauth:grant-type:token-exchange
org_id=<TextQL org id>
subject_token=<the user's ID token>
subject_token_type=urn:ietf:params:oauth:token-type:id_token
```

TextQL verifies the token against the IdP's keys, checks that the org trusts its
issuer and audience, finds the member that identity signed in as, and
returns an access token with `api:read api:write`. There is no TextQL refresh
token, and the access token expires no later than the ID token.

So each user's `TokenManager` gets a `renew` callback instead of a refresh
token. When the TextQL token is under a minute from expiry, `renew` takes a
fresh ID token (refreshing it with the IdP's refresh token when under five minutes
are left) and exchanges again. This runs under SQLite's write lock
(`BEGIN IMMEDIATE`), so two requests never spend the same IdP refresh token.
If the IdP won't refresh, the user is signed out; if TextQL refuses the exchange,
the UI shows why and offers to retry.

## Setup

**1. The IdP: an app for this tool.** An OIDC web app at the same IdP and issuer
TextQL signs in with. In Okta: Applications > Create App Integration > OIDC,
Web Application:

- **Grant types:** Authorization Code and Refresh Token
- **Sign-in redirect URI:** `http://localhost:5175/callback`
- **Assignments:** the users who will test it

Use a different app from the one TextQL signs in with. TextQL never accepts its
own client ID as an exchange audience, and this app's ID tokens carry this
app's client ID as their audience.

**2. TextQL: trust it.** Under **Settings > Security > Authentication**, on the org's OIDC
provider (same issuer as `IDP_ISSUER`, character for character; in Okta, the org
server `https://<you>.okta.com` and `…/oauth2/default` are different issuers).
It must be a provider added there, not one set by `OIDC_*` environment
variables: those can't turn on token exchange.

- turn on **Allow token exchange**
- add the step 1 app's client ID as an accepted audience

**3. Each test user signs in to TextQL through that provider once.** That links their IdP
identity to their TextQL member; until then the exchange fails with "no user has
signed in with this identity". `@textql.com` accounts can't use token exchange.

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

The UI shows TextQL's `error_description` and the reason code. TextQL also
writes every failed exchange to the org's audit log.

| You see | Fix |
|---|---|
| `this organization does not accept tokens from that issuer` | Token exchange is off, or the provider's issuer differs from `IDP_ISSUER` |
| `subject_token audience is not accepted` | Add this app's client ID as an audience (and don't reuse TextQL's own) |
| `no user has signed in with this identity` | Sign in to TextQL through that provider once as that user |
| `user is not a member of this organization` | Invite them, or check `TEXTQL_ORG_ID` |
| `this user cannot sign in by token exchange` | `@textql.com` accounts are excluded; test with another user |

## Things to change before using this for real

- **Encrypt the IdP `refresh_token` at rest.** It mints new ID tokens, and so new TextQL access.
- **Serve over HTTPS** and add `secure=True` to the cookies in `idp_login.py`.
- **Verify the ID token** if it reaches you any other way than straight from the IdP's
  token endpoint. This app reads its claims without checking the signature
  because it did; TextQL checks the signature on every exchange.
- **Multiple backend processes** are fine on one SQLite file (`BEGIN IMMEDIATE` is a
  file lock). On Postgres, use `SELECT ... FOR UPDATE` on the user's token row instead.
- **Sign-out** only ends this app's session. Add the IdP's `end_session_endpoint` to
  sign out there too; a TextQL token already issued keeps working until it expires.
