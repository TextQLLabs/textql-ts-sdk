# TextQL identity provider + assumed role example (Python backend + React)

An internal tool that signs users in with your identity provider (Okta, Entra
ID, any OIDC IdP that TextQL also trusts) and chats with TextQL **as that
user, scoped to a set of roles**. It is the
[`python-idp-federation-demo`](../python-idp-federation-demo) with one more
step: after the token exchange, the backend makes the user assume roles the
way **Assume Roles** does in the TextQL app.

| File | What it does |
|---|---|
| `backend/migrations/0001_init.sql` | The schema |
| `backend/app/db.py` | Opens `backend/app.db` and runs any migrations it hasn't seen |
| `backend/app/idp_login.py` | Sign in with the IdP (authorization code + PKCE, endpoints from OIDC discovery), the `sid` session cookie, IdP token refresh |
| `backend/app/textql_federation.py` | The exchange, the role key, renewing it, sign-out, and the per-request TextQL client |

On the frontend, `frontend/src/components/AuthGate.tsx` shows "Sign in with
<`IDP_NAME`>", runs the exchange and the role step, then shows the chat.

## How it works

```
1. Sign in with the IdP   GET  /v3/auth/login             state + PKCE verifier + nonce -> 302 to the IdP
   back from the IdP      GET  /callback?code=&state=     code -> ID + access token -> users + idp_tokens rows, sid cookie
2. Exchange and assume    POST /v3/auth/textql/exchange   exchange_token -> who_am_i -> create_api_key -> textql_role_keys row
3. Chat                   /v3/textql/*                    bind_textql: a client built from this user's role key
```

Step 2 is three calls:

| Call | Sent with | Gives |
|---|---|---|
| `exchange_token(access_token, org_id=...)` | the user's IdP access token | a TextQL access token for the member that identity signed in as |
| `rbac.who_am_i()` | that TextQL access token | the member's ID |
| `rbac.create_api_key(target_member_id=..., assumed_roles=roles, expiry_seconds=7200)` | the minter API key | an API key that acts as the member with only those roles |

The TextQL app does the last call with the browser session. This backend can't
do it with the exchanged token: that is an OAuth token, and TextQL does not let
OAuth tokens create API keys. So a **minter key** does it: an API key of a
service account whose role has `api_access_key:delegate`, which lets it mint
keys for other members, bounded by the roles each member already holds.

The exchanged token is used once, to ask TextQL who it is for, and is not
stored. Everything under `/v3/textql` is sent with the role key.

### What the role key can do

- **The assumed roles' permissions**, and nothing from the user's other roles.
- **Objects shared with those roles, and objects shared with the user directly.**
  Objects shared only with the user's other roles are not visible. (A key
  minted for another member always keeps that member's direct grants; the app's
  own Assume Roles drops them.)
- **Never more than the user has.** TextQL refuses the mint unless the user
  already holds every role.

### How long it lasts

The key lasts two hours, the length of an Assume Roles session in the app
(`ROLE_KEY_TTL`). When under a minute is left, the next request exchanges again
and mints a new one, so the IdP still has to vouch for the user each time.
Signing out of the user's last session revokes the key; the key revokes itself,
because the minter may only revoke its own keys.

| What happened | Result |
|---|---|
| IdP refuses the refresh (`invalid_grant`) | Signed out everywhere; sign in again |
| TextQL refuses the exchange or the role | 409 with TextQL's reason; the UI shows it and offers to retry |
| IdP or TextQL down, erroring or rate limiting | 503; the stored key is kept for the next try |
| TextQL rejects the role key (member removed or banned, key revoked) | The key is dropped and the user goes back to the connect screen, which shows TextQL's reason |

### Cutting someone off

TextQL checks the member behind an API key on every request. Deactivate or
unassign the user in the IdP with SCIM provisioning to TextQL turned on, and
TextQL removes the member, so their role key stops working on the next request.
Without SCIM, nothing tells TextQL, and the key works until it expires (up to
`ROLE_KEY_TTL`): the IdP is only asked again when a key is minted. Resetting a
password or ending sessions in the IdP sends no SCIM update either.

Only the IdP refresh needs a database lock: it can rotate the refresh token,
which is single use. It runs alone in a short SQLite write transaction
(`BEGIN IMMEDIATE`) that re-reads the row and commits the rotated token before
TextQL is called.

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

**4. TextQL: the role and the minter.** As an org admin:

- Pick the roles to assume and copy their IDs (UUIDs; `rbac.list_roles()`
  returns them). **Assign them to every user who will sign in.**
- Create a service account, and a role whose only permission is
  `api_access_key:delegate`. Assign that role to the service account and
  create an API key for it. No role has this permission by default.

Whoever holds the minter key can mint a key for any member of the org, admins
included, carrying that member's full role set: `api_access_key:delegate` is
not capped by the minter's own roles. Keep it on the backend and treat it like
an admin secret. This app always names the roles it mints for (never
`inherit_all_roles`), so the keys it makes carry only `TEXTQL_ASSUME_ROLE_IDS`. Every mint is written to
the org's audit log with the member it was for.

**5. Configure:**

```sh
cp .env.example .env    # IDP_*, TEXTQL_SERVER_URL, TEXTQL_ORG_ID, TEXTQL_ASSUME_ROLE_IDS, TEXTQL_MINTER_API_KEY
```

**6. Backend** (Python 3.11). `exchange_token` is not on PyPI yet, so
`requirements.txt` installs the SDK from `main`:

```sh
cd backend
python3.11 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/uvicorn app.main:app --port 8787 --reload
```

**7. Frontend** (Node 24.16.0, pinned in `frontend/.nvmrc`), in a second terminal:

```sh
cd frontend
nvm use
npm install
npm run dev
```

Open http://localhost:5175 and sign in. Vite proxies `/v3` and
`/callback` to the backend, so the session cookie, the tokens and the IdP
client secret never leave the backend's origin.

## When it is refused

The UI shows TextQL's reason and the reason code. Once a token's
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
| `cannot assume role ... role is not assigned to that member` | Assign every role in `TEXTQL_ASSUME_ROLE_IDS` to that user in TextQL |
| `invalid assumed_roles: unknown or inaccessible role IDs` | An ID in `TEXTQL_ASSUME_ROLE_IDS` is not a role in `TEXTQL_ORG_ID` |
| `insufficient permissions to create API keys ...` | The minter's role lacks `api_access_key:delegate` |

## Things to change before using this for real

- **Encrypt the IdP `refresh_token` and `access_token`, and the role key (`textql_role_keys.api_key`), at rest.** The refresh token mints new access tokens, and so new TextQL access.
- **Keep `TEXTQL_MINTER_API_KEY` in a secret manager**, on a service account that has no other role.
- **Lower `ROLE_KEY_TTL`** if two hours is too long for a user removed at the IdP to keep TextQL access: the IdP is only asked again when a key is minted.
- **Serve over HTTPS** and add `secure=True` to the cookies in `idp_login.py`.
- **Verify the ID token** if it reaches you any other way than straight from the IdP's
  token endpoint. This app reads its claims without checking the signature
  because it did; TextQL checks the signature on every exchange.
- **Multiple backend processes** are fine on one SQLite file (`BEGIN IMMEDIATE` is a
  file lock). On Postgres, use `SELECT ... FOR UPDATE` on the user's `idp_tokens` row instead.
- **Sign-out** only ends this app's session. Add the IdP's `end_session_endpoint` to
  sign out there too.
