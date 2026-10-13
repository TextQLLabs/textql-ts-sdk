# TextQL OAuth example (Python backend + React)

An internal tool with its own user accounts that lets each user connect their
TextQL account once, then chats with TextQL **as that user**: their roles,
their connectors, their chats. No org-wide API key.

The chat UI and streaming backend are the
[`python-react-demo`](../python-react-demo)
example, unchanged apart from where its TextQL client comes
from. The backend adds three small modules:

| File | What it does |
|---|---|
| `backend/migrations/0001_init.sql` | The schema: three tables |
| `backend/app/db.py` | Opens `backend/app.db` and runs any migrations it hasn't seen |
| `backend/app/users.py` | The app's own accounts: signup, login, logout, and the `sid` session cookie |
| `backend/app/textql_oauth.py` | Connect/callback/disconnect, token storage and refresh, and the per-request TextQL client |

On the frontend, `frontend/src/components/AuthGate.tsx` shows sign-in, then
"Connect TextQL", then the chat.

## The database

| Table | One row per |
|---|---|
| `users` | account in this app (username, scrypt password hash) |
| `sessions` | signed-in browser; the `sid` cookie is the row's id. While a TextQL login is in flight it also holds the `state` and PKCE verifier, cleared at `/callback` |
| `textql_tokens` | user who has connected TextQL: access token, refresh token, expiry |

Schema changes go in the next numbered file in `backend/migrations/`; `db.init()`
runs the new ones at startup and records the version in `PRAGMA user_version`.
Delete `backend/app.db` to start over.

## How it works

```
1. Sign in to the tool          POST /v3/auth/login            users -> sessions row, sid cookie
2. Connect TextQL (once)        GET  /v3/auth/textql/connect   state + verifier on the session, 302 to TextQL
   approve on TextQL            GET  /callback?code=&state=    exchange_code(...) -> textql_tokens row
3. Chat                         /v3/textql/*                   bind_textql: this user's client
```

Every `/v3/textql` request goes through `textql_oauth.bind_textql`, which:

1. opens a SQLite write transaction (`BEGIN IMMEDIATE`) and reads the user's tokens,
2. reuses that user's cached `TokenManager` and clients, or builds them,
3. calls `manager.access_token()`, which refreshes against `/oauth/token` when under
   a minute is left, and writes the rotated pair back inside the same transaction,
4. commits, and binds the user's SDK, streaming and connector clients for the request.

The lock matters because **refresh tokens are single use**: two requests refreshing
the same user at once would spend the token twice and log the user out. A refresh
that `invalid_grant`s (revoked, expired after 30 idle days, or reused) deletes the
row and the UI drops back to "Connect TextQL".

What each user can do is the intersection of the OAuth app's scopes and their own
live TextQL permissions, checked by TextQL on every call.

## Setup

**1. Register an OAuth application** at `https://app.textql.com/settings/security`
(or your staging/on-prem host):

- **Redirect URI:** `http://localhost:5173/callback`
- **Scopes:** `api:read` and `api:write`. An app with only `mcp:tools` gets tokens
  the API rejects.

Save the client ID and secret; the secret is shown once. Users who connect must
already be members of that TextQL org.

**2. Configure:**

```sh
cp .env.example .env    # set TEXTQL_CLIENT_ID and TEXTQL_CLIENT_SECRET
```

For staging, also set `TEXTQL_SERVER_URL=https://staging.textql.com` and register
the app on staging: each environment has its own OAuth apps.

**3. Backend** (Python 3.11). `textql_sdk.oauth` is not on PyPI yet, so
`requirements.txt` installs the SDK from the
[PR branch](https://github.com/TextQLLabs/textql-python-v3/pull/69):

```sh
cd backend
python3.11 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/uvicorn app.main:app --port 8787 --reload
```

**4. Frontend** (Node 24.16.0, pinned in `frontend/.nvmrc`), in a second terminal:

```sh
cd frontend
nvm use
npm install
npm run dev
```

Open http://localhost:5173, create an account, connect TextQL, and chat. Vite
proxies `/v3` and `/callback` to the backend, so the session cookie, the tokens
and the client secret never leave the backend's origin.

## Things to change before using this for real

- **Encrypt `refresh_token` at rest.** It is a 30-day credential for that member.
- **Serve over HTTPS** and add `secure=True` to the session cookie in `users.py`.
- **Multiple backend processes** are fine on one SQLite file (`BEGIN IMMEDIATE` is a
  file lock). On Postgres, use `SELECT ... FOR UPDATE` on the user's token row instead.
- **Disconnect revokes the refresh token** at `/oauth/revoke`; the access token already
  issued keeps working until it expires (at most an hour).

## Known issue

The published Python SDK sends `Connect-Protocol-Version: 1.0`, which the server
rejects with a 400. `textql_oauth.py` rewrites it to `1` with an httpx event hook until
[textql-python-v3#70](https://github.com/TextQLLabs/textql-python-v3/pull/70)
ships.
