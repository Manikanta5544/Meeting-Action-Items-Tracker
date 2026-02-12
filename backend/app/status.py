from fastapi import APIRouter
import os, requests
from app.database import get_db

router = APIRouter()

@router.get("/status")
def status():
    # Database check
    try:
        db = get_db()
        db.execute("SELECT 1").fetchone()
        db_status = "connected"
    except:
        db_status = "error"

    # LLM check
    llm_status = "fallback-only"
    if os.getenv("GROQ_API_KEY"):
        try:
            requests.get("https://api.groq.com", timeout=3)
            llm_status = "available"
        except:
            llm_status = "api_error"

    return {
        "backend": "healthy",
        "database": db_status,
        "llm": llm_status,
        "fallback": "rule-based parser active"
    }
