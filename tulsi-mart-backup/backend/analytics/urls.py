from django.urls import path
from .views import DashboardSummaryView, AnalyticsTrendsView, ReportsView

urlpatterns = [
    path('dashboard-summary/', DashboardSummaryView.as_view(), name='dashboard-summary'),
    path('sales-trends/', AnalyticsTrendsView.as_view(), name='sales-trends'),
    path('reports/', ReportsView.as_view(), name='reports'),
]
