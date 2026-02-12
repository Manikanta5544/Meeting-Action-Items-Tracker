from database import get_db

def init_db():
    db = get_db()
    db.execute("""
    CREATE TABLE IF NOT EXISTS transcripts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        content TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    """)
    db.execute("""
    CREATE TABLE IF NOT EXISTS action_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        transcript_id INTEGER,
        task TEXT,
        owner TEXT,
        due_date TEXT,
        status TEXT DEFAULT 'open'
    )
    """)
    db.commit()
