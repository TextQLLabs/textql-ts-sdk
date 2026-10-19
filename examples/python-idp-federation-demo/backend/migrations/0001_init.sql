-- One row per identity provider user that has signed in to this app.
CREATE TABLE users (
    id         INTEGER PRIMARY KEY,
    idp_sub    TEXT NOT NULL UNIQUE,
    email      TEXT,
    name       TEXT,
    created_at REAL NOT NULL
);

-- One row per signed-in browser; the sid cookie holds the id.
CREATE TABLE sessions (
    id         TEXT PRIMARY KEY,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at REAL NOT NULL
);

-- An IdP sign-in in flight: written by /v3/auth/login, consumed by /callback.
CREATE TABLE pending_logins (
    state         TEXT PRIMARY KEY,
    code_verifier TEXT NOT NULL,
    nonce         TEXT NOT NULL,
    created_at    REAL NOT NULL
);

-- Each user's latest IdP tokens. The access token is what gets exchanged; the
-- ID token only identifies the user at sign-in.
CREATE TABLE idp_tokens (
    user_id                 INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    id_token                TEXT NOT NULL,
    refresh_token           TEXT,  -- only with offline_access; encrypt it at rest in a real app
    id_token_expires_at     REAL NOT NULL,  -- unix seconds
    access_token            TEXT NOT NULL,
    access_token_expires_at REAL NOT NULL,  -- unix seconds
    updated_at              REAL NOT NULL
);

-- The TextQL access token the IdP access token was exchanged for. There is no TextQL
-- refresh token: it is exchanged again when it runs out.
CREATE TABLE textql_tokens (
    user_id      INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    access_token TEXT NOT NULL,
    expires_at   REAL NOT NULL,  -- unix seconds
    updated_at   REAL NOT NULL
);
