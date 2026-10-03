import os
import ssl
from typing import Generator
from sqlalchemy import create_engine, text
from sqlalchemy.orm import DeclarativeBase, sessionmaker, Session
from app.core.config import settings
from app.core.logging_config import logger


class Base(DeclarativeBase):
    pass


# Extract and normalize database URL
database_url = settings.DATABASE_URL.strip()

# Detect SQLite (Localhost development) vs PyMySQL (Vercel / Render cloud MySQL)
is_sqlite = database_url.startswith("sqlite")

connect_args = {}
engine_kwargs = {
    "echo": False,
}

if is_sqlite:
    # SQLite configuration for Localhost
    connect_args["check_same_thread"] = False
    engine_kwargs["connect_args"] = connect_args
    logger.info("DATABASE CONNECTED: SQLite3 (Localhost Development)")
    print("\n==========================================")
    print("  [DATABASE CONNECTED: SQLite3 (Localhost)]")
    print("==========================================\n")
else:
    # Normalize PyMySQL driver prefix for MySQL
    if database_url.startswith("mysql://"):
        database_url = database_url.replace("mysql://", "mysql+pymysql://", 1)
    elif database_url.startswith("mysql+aiomysql://"):
        database_url = database_url.replace("mysql+aiomysql://", "mysql+pymysql://", 1)

    if "?" in database_url:
        database_url = database_url.split("?")[0]

    # SSL configuration for secure Aiven Cloud MySQL connection
    if settings.DB_SSL_MODE.upper() in ["REQUIRED", "PREFERRED", "VERIFY_CA", "VERIFY_IDENTITY"]:
        ssl_ctx = ssl.create_default_context()
        ssl_ctx.check_hostname = False
        ssl_ctx.verify_mode = ssl.CERT_NONE
        connect_args["ssl"] = ssl_ctx

    engine_kwargs["connect_args"] = connect_args
    engine_kwargs["pool_size"] = settings.DB_POOL_SIZE
    engine_kwargs["max_overflow"] = settings.DB_MAX_OVERFLOW
    engine_kwargs["pool_timeout"] = settings.DB_POOL_TIMEOUT
    engine_kwargs["pool_recycle"] = settings.DB_POOL_RECYCLE
    engine_kwargs["pool_pre_ping"] = True
    logger.info("DATABASE CONNECTED: MySQL (Aiven Cloud Host)")
    print("\n==========================================")
    print("  [DATABASE CONNECTED: MySQL (Aiven Cloud Host)]")
    print("==========================================\n")

# Create SQLAlchemy Engine
engine = create_engine(database_url, **engine_kwargs)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)


def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency that yields a SQLAlchemy database session.
    Rolls back on error and ensures the session is closed cleanly.
    """
    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        db.rollback()
        logger.error(f"Database session error: {str(e)}")
        raise
    finally:
        db.close()

