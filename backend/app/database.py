import sqlite3
import os

def get_database_path():
    # Use env variable if provided
    db_path = os.getenv("DATABASE_PATH")

    if db_path:
        return db_path

    # Default local fallback
    return "app.db"

DB_PATH = get_database_path()

def ensure_directory_exists(path: str):
    directory = os.path.dirname(path)
    if directory and not os.path.exists(directory):
        os.makedirs(directory, exist_ok=True)

def get_db():
    ensure_directory_exists(DB_PATH)
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn
