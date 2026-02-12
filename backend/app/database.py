import sqlite3
import os

DB_PATH = os.getenv("DATABASE_PATH", "app.db")

def get_db():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn
