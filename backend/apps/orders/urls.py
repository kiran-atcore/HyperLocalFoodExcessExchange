from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import OrderViewSet, AdminOrderListView

router = DefaultRouter()
router.register(r'', OrderViewSet, basename='order')

urlpatterns = [
    path('admin/list/', AdminOrderListView.as_view(), name='admin_order_list'),
    path('', include(router.urls)),
]
