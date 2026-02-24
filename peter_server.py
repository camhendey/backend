from __future__ import annotations

import time
import uuid
from pathlib import Path
from typing import Any

from fastapi import Body, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles

app = FastAPI(title="Peter Petition Input Server")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

STATIC_DIR = Path(__file__).parent / "static"

# In-memory store: session_id -> {"text": str, "question": str | None, "updated_at": float}
_SESSIONS: dict[str, dict[str, Any]] = {}


@app.get("/", response_class=HTMLResponse)
def index() -> FileResponse:
    html_path = STATIC_DIR / "peter.html"
    if not html_path.exists():
        raise HTTPException(status_code=500, detail="Missing static/peter.html")
    return FileResponse(str(html_path))


@app.get("/api/new-session")
def new_session() -> dict[str, str]:
    session_id = uuid.uuid4().hex
    _SESSIONS[session_id] = {"text": "", "question": None, "updated_at": time.time()}
    return {"session_id": session_id}


@app.post("/api/petition/{session_id}")
def set_petition(
    session_id: str,
    payload: dict[str, Any] = Body(...),
) -> dict[str, Any]:
    if session_id not in _SESSIONS:
        # auto-create so the frontend can just start posting
        _SESSIONS[session_id] = {"text": "", "question": None, "updated_at": time.time()}

    text = payload.get("text")
    if not isinstance(text, str):
        raise HTTPException(status_code=400, detail="Payload must include string field 'text'")

    _SESSIONS[session_id]["text"] = text
    _SESSIONS[session_id]["updated_at"] = time.time()
    return {"ok": True}


@app.get("/api/petition/{session_id}")
def get_petition(session_id: str) -> dict[str, Any]:
    if session_id not in _SESSIONS:
        raise HTTPException(status_code=404, detail="Unknown session_id")
    return {"session_id": session_id, **_SESSIONS[session_id]}


@app.post("/api/submit/{session_id}")
def submit(
    session_id: str,
    payload: dict[str, Any] = Body(...),
) -> dict[str, Any]:
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


app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

