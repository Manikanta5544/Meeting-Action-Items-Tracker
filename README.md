# Meeting Action Items Tracker

A lightweight full-stack web application that extracts actionable tasks from meeting transcripts, allows managing them, and keeps a short processing history.

Built as a **time-boxed, production-minded assignment**, prioritizing correctness, reliability, and clear trade-offs over unnecessary complexity.

---

##  Live Demo

**Frontend:** : https://meeting-action-items-tracker-roan.vercel.app

**Backend API:** : https://meeting-action-items-tracker-6aqr.onrender.com

**Status Page:** https://meeting-action-items-tracker-6aqr.onrender.com/status

---

## Features

- Paste a meeting transcript (plain text)
- Automatically extract action items:
  - Task description
  - Owner (if present)
  - Due date (if present)
- Mark action items as **open / done**
- Delete action items
- Filter by **All / Open / Done**
- View history of the **last 5 processed transcripts**
- Graceful fallback when AI is unavailable
- Status page showing:
  - Backend health
  - Database connectivity
  - LLM availability

---

## Tech Stack

### Backend
- **Python**
- **FastAPI**
- **SQLite** (file-based, production-safe for this scope)
- **Groq LLM (llama3-8b)** with rule-based fallback
- **Architecture**: RESTful API with clear separation between extraction logic, persistence layer, and health monitoring.

### Frontend
- **Vanilla JavaScript**
- **HTML + CSS**
- No build step, no framework dependency

### Hosting
- Backend: Render 
- Frontend: Vercel

---

## Project Structure
```
meeting-action-items/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI app + routes
│   │   ├── database.py      # SQLite connection
│   │   ├── models.py        # DB schema
│   │   ├── parser.py        # Rule-based fallback
│   │   ├── llm.py           # Groq integration
│   │   └── status.py        # Health checks
│   ├── requirements.txt
│   ├── .env.example
│   └── app.db              # SQLite file (created on first run)
│
├── frontend/
│   ├── index.html
│   ├── styles.css
│   └── app.js
│
├── README.md
├── AI_NOTES.md
├── PROMPTS_USED.md
├── ABOUTME.md
└── .gitignore
```
---
## Key Technical Decisions

### Why Vanilla JavaScript instead of React?

This was a **deliberate, senior-level choice**.

**Reasons:**
- The assignment is **time-boxed (48 hours)** — Vanilla JS allows faster, safer delivery
- Eliminates build tooling and deployment failure points
- Keeps focus on **system behavior**, not framework ceremony
- Demonstrates strong fundamentals without framework abstraction
- UI state is simple and predictable for this scope

**Trade-off:**
- For larger applications with complex state, React would be preferred
- For this problem size, React would add overhead without real benefit

> In production, I regularly use React / modern frameworks.  
> For this assignment, I prioritized **shipping a reliable product** over framework showcase.

---

##  How to Run Locally

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate 
pip install -r requirements.txt
cp .env.example .env  # Edit and add your GROQ_API_KEY
uvicorn app.main:app --reload 
```

### Frontend
```bash
cd frontend
# Open index.html directly or serve via a static server
```

## What Was Tested Manually
- Transcript with multiple action items
- Transcript with zero action items
- Missing owners / dates
- Marking items as done
- Filtering open / done items
- Deleting items
- History limit (last 5)
- AI unavailable → rule-based fallback
- Empty input handling
- Page refresh persistence

## Scope & Trade-offs
- No authentication (out of scope)
- No rich text editor (plain textarea is sufficient)
- No pagination (history capped at 5)
- No background jobs / queues
- No unit test suite (manual testing prioritized for time box)

## Failure Handling

The system is designed to remain functional in all cases:

- If the LLM is unavailable → rule-based extraction is used
- If JSON parsing fails → fallback triggered automatically
- If database is unreachable → status endpoint reflects degraded state
- If empty transcript is submitted → graceful validation message

No scenario blocks the user workflow.


## Notes

- No API keys or secrets are committed
- .env.example provided for configuration
- App continues to function fully without AI availability
- CORS is configurable via environment variables for production deployment

This project favors predictable system behavior over experimental AI usage.
