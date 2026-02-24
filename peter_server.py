from __future__ import annotations

"""
FastAPI backend for the Peter Answers style terminal emulator.

This service has two main responsibilities:
1. Serve the static HTML / CSS / JS that implements the fake terminal UI.
2. Provide a tiny JSON API to:
   - Create sessions.
   - Store the user's hidden "petition" text and visible question.
   - Let the Streamlit viewer fetch the captured data.
"""

import time
import uuid
from pathlib import Path
from typing import Any

from fastapi import Body, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles


app = FastAPI(title="Peter Petition Input Server")

# Allow the HTML/JS to be opened directly in a browser and still talk to this API.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Folder that contains peter.html, peter.js, peter.css, etc.
STATIC_DIR = Path(__file__).parent / "static"

# Very small in‑memory "database":
#   session_id -> {"text": str, "question": str | None, "updated_at": float}
#
# This is good enough for a demo / local tool. If you wanted persistence
# across restarts or multiple processes you would plug in a real database.
_SESSIONS: dict[str, dict[str, Any]] = {}


@app.get("/", response_class=HTMLResponse)
def index() -> FileResponse:
    """
    Serve the main terminal‑style UI (peter.html).

    The browser loads this once; all further interaction happens via JS
    calling the JSON endpoints below.
    """
    html_path = STATIC_DIR / "peter.html"
    if not html_path.exists():
        raise HTTPException(status_code=500, detail="Missing static/peter.html")
    return FileResponse(str(html_path))


@app.get("/api/new-session")
def new_session() -> dict[str, str]:
    """
    Create a new logical "session" for one run of the terminal.

    The browser remembers the returned session_id in localStorage and
    uses it for all subsequent POST / GET calls.
    """
    session_id = uuid.uuid4().hex
    _SESSIONS[session_id] = {"text": "", "question": None, "updated_at": time.time()}
    return {"session_id": session_id}


@app.post("/api/petition/{session_id}")
def set_petition(
    session_id: str,
    payload: dict[str, Any] = Body(...),
) -> dict[str, Any]:
    """
    Store the raw petition text as the user types.

    The frontend calls this frequently while the petition field changes,
    but only the last value is kept.
    """
    if session_id not in _SESSIONS:
        # Auto‑create so the frontend can start POSTing before explicitly
        # calling /api/new-session (makes the JS a bit more forgiving).
        _SESSIONS[session_id] = {"text": "", "question": None, "updated_at": time.time()}

    text = payload.get("text")
    if not isinstance(text, str):
        raise HTTPException(status_code=400, detail="Payload must include string field 'text'")

    _SESSIONS[session_id]["text"] = text
    _SESSIONS[session_id]["updated_at"] = time.time()
    return {"ok": True}


@app.get("/api/petition/{session_id}")
def get_petition(session_id: str) -> dict[str, Any]:
    """
    Return the stored petition / question for a given session.

    Used by the Streamlit viewer to display what the user really typed.
    """
    if session_id not in _SESSIONS:
        raise HTTPException(status_code=404, detail="Unknown session_id")
    return {"session_id": session_id, **_SESSIONS[session_id]}


@app.post("/api/submit/{session_id}")
def submit(
    session_id: str,
    payload: dict[str, Any] = Body(...),
) -> dict[str, Any]:
    """
    Final submission endpoint once the user has completed Access code + Query.

    The JS sends the "extracted" petition segment and the visible query here
    after the loading animation finishes.
    """
    if session_id not in _SESSIONS:
        _SESSIONS[session_id] = {"text": "", "question": None, "updated_at": time.time()}

    petition = payload.get("petition")
    question = payload.get("question")
    if not isinstance(petition, str):
        raise HTTPException(status_code=400, detail="Field 'petition' must be a string")
    if question is not None and not isinstance(question, str):
        raise HTTPException(status_code=400, detail="Field 'question' must be a string or null")

    _SESSIONS[session_id]["text"] = petition
    _SESSIONS[session_id]["question"] = question
    _SESSIONS[session_id]["updated_at"] = time.time()
    return {"ok": True}


# Expose /static so peter.html can load peter.js and peter.css.
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

