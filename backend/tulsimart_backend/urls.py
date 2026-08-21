from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
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
