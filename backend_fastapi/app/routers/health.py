from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.database import get_db

router = APIRouter(tags=["Health Check & Keep-Alive"])


@router.get("/health/")
@router.get("/health")
def health_check(db: Session = Depends(get_db)):
    """
    Lightweight health endpoint for uptime monitors and keep-alive ping.
    Tests actual MySQL connection with 'SELECT 1;'.
    """
    try:
        db.execute(text("SELECT 1;"))
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "success": True,
                "server": "online",
                "database": "connected"
            }
        )
    except Exception:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "success": False,
                "server": "online",
                "database": "disconnected"
            }
        )


@router.get("/health/light")
def lightweight_health_check():
    """
    Ultra-lightweight ping endpoint for Render keep-alive calls without DB overhead.
    """
    return {
        "success": True,
        "server": "online",
        "database": "active"
    }
