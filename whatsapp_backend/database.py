"""
database.py — Thin PostgreSQL layer using psycopg2.

All user phone numbers are stored in a `whatsapp_users` table.
If you are already using Prisma for the Next.js frontend, this service
writes to the same Neon database but to its own table, keeping things
cleanly separated and not requiring any schema migration on the frontend.
"""
import psycopg2
import psycopg2.extras
import logging
from contextlib import contextmanager
from typing import Optional
from config import DATABASE_URL

logger = logging.getLogger(__name__)


@contextmanager
def get_connection():
    """Context manager that opens and auto-closes a DB connection."""
    conn = psycopg2.connect(DATABASE_URL, cursor_factory=psycopg2.extras.RealDictCursor)
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def ensure_table_exists() -> None:
    """
    Create the whatsapp_users table if it doesn't already exist.
    Called once at application startup.
    """
    ddl = """
    CREATE TABLE IF NOT EXISTS whatsapp_users (
        user_id       TEXT PRIMARY KEY,
        phone_number  TEXT,
        created_at    TIMESTAMPTZ DEFAULT NOW(),
        updated_at    TIMESTAMPTZ DEFAULT NOW()
    );
    """
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(ddl)
    logger.info("whatsapp_users table ready.")


def upsert_user_phone(user_id: str, phone_number: str) -> None:
    """
    Insert or update a user's phone number.
    Uses ON CONFLICT to handle both new and existing users.
    """
    sql = """
    INSERT INTO whatsapp_users (user_id, phone_number, updated_at)
    VALUES (%s, %s, NOW())
    ON CONFLICT (user_id)
    DO UPDATE SET phone_number = EXCLUDED.phone_number,
                  updated_at   = NOW();
    """
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, (user_id, phone_number))
    logger.info("Saved phone %s for user_id=%s", phone_number, user_id)


def get_user_phone(user_id: str) -> Optional[str]:
    """
    Retrieve a user's phone number by user_id.
    Returns None if not found.
    """
    sql = "SELECT phone_number FROM whatsapp_users WHERE user_id = %s;"
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, (user_id,))
            row = cur.fetchone()
    if row:
        return row["phone_number"]
    return None
