import ssl
from typing import Generator
from sqlalchemy import create_engine, text
from sqlalchemy.orm import DeclarativeBase, sessionmaker, Session
from app.core.config import settings
from app.core.logging_config import logger


class Base(DeclarativeBase):
    pass


# Normalize database URL
database_url = settings.DATABASE_URL
if "?" in database_url:
    database_url = database_url.split("?")[0]

connect_args = {}
# Configure SSL context for secure cloud MySQL (e.g., Aiven / AWS RDS / DigitalOcean)
if settings.DB_SSL_MODE.upper() in ["REQUIRED", "PREFERRED", "VERIFY_CA", "VERIFY_IDENTITY"]:
    ssl_ctx = ssl.create_default_context()
    ssl_ctx.check_hostname = False
    ssl_ctx.verify_mode = ssl.CERT_NONE
    connect_args["ssl"] = ssl_ctx

# Production-safe SQLAlchemy engine using PyMySQL driver
engine = create_engine(
    database_url,
    pool_size=settings.DB_POOL_SIZE,
    max_overflow=settings.DB_MAX_OVERFLOW,
    pool_timeout=settings.DB_POOL_TIMEOUT,
    pool_recycle=settings.DB_POOL_RECYCLE,
    pool_pre_ping=True,
    echo=False,
    connect_args=connect_args
)

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
