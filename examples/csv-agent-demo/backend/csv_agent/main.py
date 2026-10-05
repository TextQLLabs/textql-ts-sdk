"""The agent-chat-demo FastAPI app, plus the CSV routes this demo adds.

Uploads, agent attachment, streaming, and the preview proxy are all the
sibling example's routes under /v3/textql; this package only adds /v3/csv.
"""

import sys
from pathlib import Path

import dotenv

DEMO_ROOT = Path(__file__).resolve().parents[2]
dotenv.load_dotenv(DEMO_ROOT / ".env")
# The sibling app loads its own .env on import; this demo's .env is the only config.
dotenv.load_dotenv = lambda *args, **kwargs: False
sys.path.insert(0, str(DEMO_ROOT.parent / "agent-chat-demo" / "backend"))

from app.main import app  # noqa: E402

from csv_agent.runs import router  # noqa: E402

app.title = "TextQL CSV Agent Demo"
app.include_router(router)
