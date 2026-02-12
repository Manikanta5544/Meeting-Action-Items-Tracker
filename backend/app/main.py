from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from database import get_db
from models import init_db
from parser import parse_actions
from llm import extract_with_llm
from status import router as status_router

app = FastAPI(title="Meeting Action Items API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

init_db()
app.include_router(status_router)

class TranscriptInput(BaseModel):
    text: str

class ActionItemCreate(BaseModel):
    task: str
    owner: Optional[str] = None
    due_date: Optional[str] = None

class ActionItemUpdate(BaseModel):
    task: Optional[str]
    owner: Optional[str]
    due_date: Optional[str]
    status: Optional[str]

@app.post("/api/transcripts")
def process_transcript(payload: TranscriptInput):
    if not payload.text.strip():
        raise HTTPException(400, "Empty transcript")

    db = get_db()
    cur = db.execute(
        "INSERT INTO transcripts (content) VALUES (?)",
        (payload.text,)
    )
    transcript_id = cur.lastrowid
    db.commit()

    actions = extract_with_llm(payload.text)
    source = "llm"

    if not actions:
        actions = parse_actions(payload.text)
        source = "rule-based"

    for a in actions:
        db.execute("""
            INSERT INTO action_items (transcript_id, task, owner, due_date, status)
            VALUES (?, ?, ?, ?, 'open')
        """, (transcript_id, a["task"], a.get("owner"), a.get("due_date")))
    db.commit()

    return {"transcript_id": transcript_id, "source": source}

@app.get("/api/transcripts")
def get_transcripts():
    db = get_db()
    rows = db.execute("""
        SELECT t.id, t.created_at, COUNT(a.id) AS item_count
        FROM transcripts t
        LEFT JOIN action_items a ON a.transcript_id = t.id
        GROUP BY t.id
        ORDER BY t.created_at DESC
        LIMIT 5
    """).fetchall()
    return [dict(r) for r in rows]

@app.get("/api/transcripts/{tid}")
def get_items(tid: int, status: Optional[str] = None):
    db = get_db()
    q = "SELECT * FROM action_items WHERE transcript_id=?"
    params = [tid]
    if status in ["open", "done"]:
        q += " AND status=?"
        params.append(status)
    rows = db.execute(q, params).fetchall()
    return [dict(r) for r in rows]

@app.post("/api/action-items")
def add_item(item: ActionItemCreate):
    db = get_db()
    cur = db.execute("""
        INSERT INTO action_items (transcript_id, task, owner, due_date, status)
        VALUES (?, ?, ?, ?, 'open')
    """, (item.transcript_id, item.task, item.owner, item.due_date))
    db.commit()
    return {"id": cur.lastrowid}


@app.put("/api/action-items/{item_id}")
def update_item(item_id: int, item: ActionItemUpdate):
    db = get_db()
    fields, values = [], []
    for k, v in item.dict(exclude_none=True).items():
        fields.append(f"{k}=?")
        values.append(v)
    if not fields:
        raise HTTPException(400, "No updates")
    values.append(item_id)
    db.execute(f"UPDATE action_items SET {', '.join(fields)} WHERE id=?", values)
    db.commit()
    return {"updated": True}

@app.delete("/api/action-items/{item_id}")
def delete_item(item_id: int):
    db = get_db()
    db.execute("DELETE FROM action_items WHERE id=?", (item_id,))
    db.commit()
    return {"deleted": True}
