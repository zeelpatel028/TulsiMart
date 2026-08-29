from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    StaffViewSet, 
    ActivityLogViewSet,
    BankTransactionViewSet,
    StoreSettingView,
    LoginAccountViewSet,
    gulla_summary_view,
    gulla_entry_create_view,
    calculate_denomination_api,
    eod_cash_sweep_api,
    home_cash_vault_api,
    login_auth_view,
    verify_otp_auth_view,
    get_me_auth_view
)

router = DefaultRouter()
router.trailing_slash = '/?'
router.register(r'staff', StaffViewSet, basename='staff')
router.register(r'login-accounts', LoginAccountViewSet, basename='login-accounts')
router.register(r'logs', ActivityLogViewSet, basename='logs')
router.register(r'bank-transactions', BankTransactionViewSet, basename='bank-transactions')


urlpatterns = [
    path('auth/login/', login_auth_view, name='auth-login'),
    path('auth/verify-otp/', verify_otp_auth_view, name='auth-verify-otp'),
    path('auth/me/', get_me_auth_view, name='auth-me'),
    path('settings/', StoreSettingView.as_view(), name='settings'),
    path('home-cash/', home_cash_vault_api, name='home-cash-vault'),
    path('gulla/', gulla_summary_view, name='gulla-summary'),
    path('gulla/entry/', gulla_entry_create_view, name='gulla-entry'),
    path('gulla/eod-sweep/', eod_cash_sweep_api, name='gulla-eod-sweep'),
    path('gulla/calculate-notes/', calculate_denomination_api, name='gulla-calc-notes'),
    path('', include(router.urls)),
]



