from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SupplierViewSet, PurchaseOrderViewSet, GoodsReceiptNoteViewSet, SupplierPaymentViewSet

router = DefaultRouter()
router.register(r'suppliers', SupplierViewSet, basename='supplier')
router.register(r'purchase-orders', PurchaseOrderViewSet, basename='purchase-order')
router.register(r'grn', GoodsReceiptNoteViewSet, basename='goods-receipt-note')
router.register(r'payments', SupplierPaymentViewSet, basename='supplier-payment')

urlpatterns = [
    path('', include(router.urls)),
]
