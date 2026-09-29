from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import OrderViewSet, PaymentTransactionViewSet

router = DefaultRouter()
router.register(r'orders', OrderViewSet, basename='order')
router.register(r'payments', PaymentTransactionViewSet, basename='payment')

urlpatterns = [
    path('', include(router.urls)),
]
