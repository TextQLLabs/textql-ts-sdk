-- The app's own accounts.
CREATE TABLE users (
    id            INTEGER PRIMARY KEY,
    username      TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at    REAL NOT NULL
);

-- One row per signed-in browser; the sid cookie holds the id.
CREATE TABLE sessions (
    id                 TEXT PRIMARY KEY,
    user_id            INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at         REAL NOT NULL,
    -- Set by /v3/auth/textql/connect, checked and cleared by /callback.
    oauth_state        TEXT,
    oauth_verifier     TEXT
);

-- Each user's TextQL token pair, once they've connected.
CREATE TABLE textql_tokens (
    user_id       INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    access_token  TEXT NOT NULL,
    refresh_token TEXT NOT NULL,  -- a 30-day credential: encrypt it at rest in a real app
    expires_at    REAL NOT NULL,  -- unix seconds
    updated_at    REAL NOT NULL
);
