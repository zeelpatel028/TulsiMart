from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.core.database import get_db
from app.utils.response import success_response, error_response

router = APIRouter(tags=["Health"])


@router.get("/health/")
@router.get("/health")
async def health_check():
    return success_response(
        data={
            "status": "healthy",
            "service": "Tulsi Mart FastAPI Backend",
            "version": "1.0.0"
        },
        message="System operating normally"
    )


@router.get("/health/db")
async def db_health_check(db: AsyncSession = Depends(get_db)):
    try:
        await db.execute(text("SELECT 1"))
        return success_response(
            data={"database": "connected", "status": "healthy"},
            message="Database connection active"
        )
    except Exception as e:
        return error_response(
            message=f"Database connection failed: {str(e)}",
            status_code=500
        )

