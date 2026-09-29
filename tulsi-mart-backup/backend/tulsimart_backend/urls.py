from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from core.views import StoreSettingView, HealthCheckView

from django.http import JsonResponse

def root_health_check(request):
    return JsonResponse({
        "status": "ok",
        "message": "Tulsi Mart API is running"
    })

urlpatterns = [
    path('', root_health_check, name='api-root'),
    path('api/health/', HealthCheckView.as_view(), name='api-health'),
    path('health/', HealthCheckView.as_view(), name='health'),
    path('admin/', admin.site.urls),
    path('api/settings/', StoreSettingView.as_view(), name='api-settings'),
    path('api/core/', include('core.urls')),
    path('api/inventory/', include('inventory.urls')),
    path('api/customers/', include('customers.urls')),
    path('api/orders/', include('orders.urls')),
    path('api/suppliers/', include('suppliers.urls')),
    path('api/expenses/', include('expenses.urls')),
    path('api/offers/', include('offers.urls')),
    path('api/analytics/', include('analytics.urls')),
]



if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
