from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    login_view, 
    send_otp_view,
    verify_otp_view,
    me_view, 
    StaffViewSet, 
    StoreSettingViewSet, 
    ActivityLogViewSet,
    BankTransactionViewSet,
    mongodb_status_view,
    mongodb_sync_view,
    gulla_summary_view,
    gulla_entry_create_view,
    calculate_denomination_api,
    eod_cash_sweep_api
)

router = DefaultRouter()
router.register(r'staff', StaffViewSet, basename='staff')
router.register(r'logs', ActivityLogViewSet, basename='logs')
router.register(r'bank-transactions', BankTransactionViewSet, basename='bank-transactions')

urlpatterns = [
    path('auth/login/', login_view, name='login'),
    path('auth/send-otp/', send_otp_view, name='send-otp'),
    path('auth/verify-otp/', verify_otp_view, name='verify-otp'),
    path('auth/me/', me_view, name='me'),
    path('settings/', StoreSettingViewSet.as_view({'get': 'list', 'post': 'create'}), name='settings'),
    path('gulla/', gulla_summary_view, name='gulla-summary'),
    path('gulla/entry/', gulla_entry_create_view, name='gulla-entry'),
    path('gulla/eod-sweep/', eod_cash_sweep_api, name='gulla-eod-sweep'),
    path('gulla/calculate-notes/', calculate_denomination_api, name='gulla-calc-notes'),
    path('mongodb/status/', mongodb_status_view, name='mongodb-status'),
    path('mongodb/sync/', mongodb_sync_view, name='mongodb-sync'),
    path('', include(router.urls)),
]

