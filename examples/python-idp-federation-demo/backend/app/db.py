"""The example's whole database: one SQLite file next to the backend.

The schema lives in backend/migrations/NNNN_*.sql. `init` runs the ones newer
than the file's `PRAGMA user_version` and bumps it, so adding a table is adding
the next numbered file. The `Table`s below mirror it for building queries with
SQLAlchemy Core.
"""

from pathlib import Path

from sqlalchemy import Column, Float, ForeignKey, Integer, MetaData, Table, Text, create_engine, event

BACKEND_DIR = Path(__file__).resolve().parents[1]
DB_PATH = BACKEND_DIR / "app.db"
MIGRATIONS_DIR = BACKEND_DIR / "migrations"

engine = create_engine(
    f"sqlite:///{DB_PATH}",
    connect_args={"timeout": 30, "check_same_thread": False},
)


@event.listens_for(engine, "connect")
def _on_connect(dbapi_conn, _record) -> None:
    # Hand BEGIN to SQLAlchemy instead of the sqlite3 module's implicit one.
    dbapi_conn.isolation_level = None
    dbapi_conn.execute("PRAGMA foreign_keys = ON")


@event.listens_for(engine, "begin")
def _on_begin(conn) -> None:
    # Take the write lock up front. Token renewal relies on it: two requests
    # must never spend the same IdP refresh token, which the IdP may rotate.
    conn.exec_driver_sql("BEGIN IMMEDIATE")


metadata = MetaData()

users = Table(
    "users", metadata,
    Column("id", Integer, primary_key=True),
    Column("idp_sub", Text, nullable=False, unique=True),
    Column("email", Text),
    Column("name", Text),
    Column("created_at", Float, nullable=False),
)

sessions = Table(
    "sessions", metadata,
    Column("id", Text, primary_key=True),
    Column("user_id", Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
    Column("created_at", Float, nullable=False),
)

pending_logins = Table(
    "pending_logins", metadata,
    Column("state", Text, primary_key=True),
    Column("code_verifier", Text, nullable=False),
    Column("nonce", Text, nullable=False),
    Column("created_at", Float, nullable=False),
)

idp_tokens = Table(
    "idp_tokens", metadata,
    Column("user_id", Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    Column("id_token", Text, nullable=False),
    Column("refresh_token", Text),
    Column("id_token_expires_at", Float, nullable=False),
    Column("access_token", Text, nullable=False),
    Column("access_token_expires_at", Float, nullable=False),
    Column("updated_at", Float, nullable=False),
)

textql_tokens = Table(
    "textql_tokens", metadata,
    Column("user_id", Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    Column("access_token", Text, nullable=False),
    Column("expires_at", Float, nullable=False),
    Column("updated_at", Float, nullable=False),
)


def init() -> None:
    conn = engine.raw_connection()
    try:
        current = conn.execute("PRAGMA user_version").fetchone()[0]
        for path in sorted(MIGRATIONS_DIR.glob("*.sql")):
            version = int(path.name.split("_", 1)[0])
            if version > current:
                conn.executescript(f"BEGIN;\n{path.read_text()}\nPRAGMA user_version = {version};\nCOMMIT;")
    finally:
        conn.close()
