from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import TaxReceipt
from .serializers import TaxReceiptSerializer

class TaxReceiptViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = TaxReceiptSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return TaxReceipt.objects.all()
        if user.role == 'donor':
            return TaxReceipt.objects.filter(donor=user)
        return TaxReceipt.objects.none()

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        if request.user.role != 'admin':
            return Response({'error': 'Unauthorized'}, status=403)
        receipt = self.get_object()
        if receipt.status != 'PENDING':
            return Response({'error': 'Receipt is not pending'}, status=400)
            
        approved_value = request.data.get('approved_value')
        if approved_value is not None:
            receipt.estimated_value = approved_value
            
        receipt.status = 'APPROVED'
        receipt.save()
        
        # Keep listing consistent
        receipt.listing.estimated_fmv = receipt.estimated_value
        receipt.listing.save()
        
        return Response({'status': 'approved'})
        
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        if request.user.role != 'admin':
            return Response({'error': 'Unauthorized'}, status=403)
        receipt = self.get_object()
        if receipt.status != 'PENDING':
            return Response({'error': 'Receipt is not pending'}, status=400)
            
        receipt.status = 'REJECTED'
        receipt.save()
        return Response({'status': 'rejected'})
