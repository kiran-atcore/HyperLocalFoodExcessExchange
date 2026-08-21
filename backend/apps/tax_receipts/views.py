from rest_framework import viewsets, permissions
from .models import TaxReceipt
from .serializers import TaxReceiptSerializer

class TaxReceiptViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = TaxReceiptSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'donor':
            return TaxReceipt.objects.filter(donor=user)
        return TaxReceipt.objects.none()
