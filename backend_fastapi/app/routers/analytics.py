from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.services.analytics_service import AnalyticsService
from app.utils.response import success_response

router = APIRouter(tags=["Analytics & Dashboard"])

@router.get("/analytics/dashboard-summary/")
async def get_dashboard_summary(db: AsyncSession = Depends(get_db)):
    service = AnalyticsService(db)
    summary = await service.get_dashboard_summary()
    return success_response(data=summary, message="Dashboard summary fetched")


@router.get("/analytics/sales-trends/")
async def get_sales_trends(
    days: int = Query(7, ge=1, le=365),
    db: AsyncSession = Depends(get_db)
):
    service = AnalyticsService(db)
    trends = await service.get_sales_trends(days=days)
    return success_response(data=trends, message="Sales trends fetched")


@router.get("/analytics/reports/")
async def get_reports(db: AsyncSession = Depends(get_db)):
    service = AnalyticsService(db)
    reports = await service.get_reports()
    return success_response(data=reports, message="Analytics reports fetched")
