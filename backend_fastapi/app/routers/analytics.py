from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.services.analytics_service import AnalyticsService
from app.utils.response import success_response

router = APIRouter(tags=["Analytics & Dashboard"])

@router.get("/analytics/dashboard-summary/")
def get_dashboard_summary(db: Session = Depends(get_db)):
    service = AnalyticsService(db)
    summary = service.get_dashboard_summary()
    return success_response(data=summary, message="Dashboard summary fetched")


@router.get("/analytics/admin-dashboard/")
def get_admin_dashboard_summary(db: Session = Depends(get_db)):
    service = AnalyticsService(db)
    summary = service.get_admin_dashboard_summary()
    return success_response(data=summary, message="Super Admin dashboard summary fetched")



@router.get("/analytics/sales-trends/")
def get_sales_trends(
    days: Optional[int] = Query(None, ge=1, le=365),
    period: Optional[str] = Query(None),
    timeframe: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    service = AnalyticsService(db)
    p = period or timeframe or "month"
    trends = service.get_sales_trends(days=days, period=p)
    return success_response(data=trends, message="Sales trends fetched")


@router.get("/analytics/reports/")
def get_reports(
    report_type: Optional[str] = Query("sales", alias="type"),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    service = AnalyticsService(db)
    reports = service.get_reports(
        report_type=report_type,
        date_from=date_from,
        date_to=date_to,
        category=category,
        search=search
    )
    return success_response(data=reports, message="Analytics reports fetched")
