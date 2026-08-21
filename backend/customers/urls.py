from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CustomerViewSet, CustomerFeedbackViewSet

router = DefaultRouter()
router.register(r'customers', CustomerViewSet, basename='customer')
router.register(r'feedback', CustomerFeedbackViewSet, basename='customer-feedback')

urlpatterns = [
    path('', include(router.urls)),
]
