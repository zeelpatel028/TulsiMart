from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CouponViewSet, FestivalOfferViewSet

router = DefaultRouter()
router.register(r'coupons', CouponViewSet, basename='coupon')
router.register(r'festival-offers', FestivalOfferViewSet, basename='festival-offer')

urlpatterns = [
    path('', include(router.urls)),
]
