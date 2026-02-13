import sqlite3
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Default DB inside project folder
DEFAULT_DB_PATH = os.path.join(BASE_DIR, "app.db")

DB_PATH = os.getenv("DATABASE_PATH", DEFAULT_DB_PATH)


def get_db():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn
