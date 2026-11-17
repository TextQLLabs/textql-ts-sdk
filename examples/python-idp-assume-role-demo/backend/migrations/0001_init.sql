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

-- The TextQL API key minted for the user, scoped to the assumed roles. The
-- exchanged TextQL access token is not stored: it is used once, to learn which
-- member the key is for. The key is minted again when it runs out.
CREATE TABLE textql_role_keys (
    user_id    INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    api_key_id TEXT NOT NULL,  -- what RevokeApiKey takes
    api_key    TEXT NOT NULL,  -- the secret; encrypt it at rest in a real app
    role_ids   TEXT NOT NULL,  -- JSON array, as configured when the key was minted
    role_names TEXT NOT NULL,  -- JSON array, TextQL's names for them
    expires_at REAL NOT NULL,  -- unix seconds
    updated_at REAL NOT NULL
);
