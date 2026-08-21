from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TaxReceiptViewSet

router = DefaultRouter()
router.register(r'', TaxReceiptViewSet, basename='tax-receipt')

urlpatterns = [
    path('', include(router.urls)),
]
