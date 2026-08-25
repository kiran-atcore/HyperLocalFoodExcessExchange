from rest_framework import viewsets, permissions, status, filters
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Order, OrderStatus
from .serializers import OrderSerializer
from apps.tax_receipts.models import TaxReceipt

class OrderViewSet(viewsets.ModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['listing']

    def get_queryset(self):
        user = self.request.user
        from django.db.models import Q
        from django.utils import timezone
        from .models import OrderStatus
        
        # Lazy background sweep to auto-cancel any expired claims across the platform
        Order.objects.filter(
            listing__pickup_end__lte=timezone.now()
        ).exclude(
            status__in=[OrderStatus.PICKED_UP, OrderStatus.CANCELLED, OrderStatus.EXPIRED]
        ).update(status=OrderStatus.EXPIRED)

        if user.role == 'donor':
            return Order.objects.filter(Q(listing__donor=user) | Q(requester=user))
        return Order.objects.filter(requester=user)

    def create(self, request, *args, **kwargs):
        listing_id = request.data.get('listing')
        if not listing_id:
            return Response({'error': 'Listing ID is required.'}, status=status.HTTP_400_BAD_REQUEST)
            
        from django.db import transaction
        from apps.listings.models import FoodListing
        
        with transaction.atomic():
            try:
                # Lock the listing row to prevent concurrent claims
                listing = FoodListing.objects.select_for_update().get(id=listing_id)
            except FoodListing.DoesNotExist:
                return Response({'error': 'Listing not found.'}, status=status.HTTP_404_NOT_FOUND)
                
            if listing.orders.exclude(status__in=['CANCELLED', 'EXPIRED']).exists():
                return Response({'error': 'This donation has already been claimed by another shelter.'}, status=status.HTTP_400_BAD_REQUEST)
                
            return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        serializer.save(requester=self.request.user)

    @action(detail=True, methods=['patch'])
    def complete(self, request, pk=None):
        order = self.get_object()
        
        # Only donor can complete an order
        if order.listing.donor != request.user:
            return Response({'error': 'Not authorized.'}, status=status.HTTP_403_FORBIDDEN)
            
        from django.utils import timezone
        
        if order.status not in [OrderStatus.PICKED_UP, OrderStatus.CANCELLED, OrderStatus.EXPIRED]:
            if order.listing.pickup_end and order.listing.pickup_end <= timezone.now():
                order.status = OrderStatus.EXPIRED
                order.save()
                
        if order.status == OrderStatus.EXPIRED:
            return Response({'error': 'This claim has expired.'}, status=status.HTTP_400_BAD_REQUEST)
            
        if order.status == OrderStatus.PICKED_UP:
            return Response({'error': 'Already picked up.'}, status=status.HTTP_400_BAD_REQUEST)
            
        if order.status == OrderStatus.CANCELLED:
            return Response({'error': 'This claim was cancelled.'}, status=status.HTTP_400_BAD_REQUEST)

        order.status = OrderStatus.PICKED_UP
        order.save()

        # Generate Tax Receipt if requested by a Shelter and listing is a Donation
        if order.requester.role == 'shelter' and order.listing.listing_type == 'DONATION':
            TaxReceipt.objects.get_or_create(
                order=order,
                defaults={
                    'donor': order.listing.donor,
                    'ngo': order.requester,
                    'listing': order.listing,
                    'estimated_value': order.listing.estimated_fmv,
                    'status': 'PENDING' if order.listing.is_ai_flagged else 'APPROVED'
                }
            )

        return Response({'status': 'Order completed successfully.'})

    @action(detail=False, methods=['post'], url_path='complete_qr')
    def complete_qr(self, request):
        qr_code_id = request.data.get('qr_code_id')
        if not qr_code_id:
            return Response({'error': 'qr_code_id is required.'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            order = Order.objects.get(qr_code_id=qr_code_id)
        except Order.DoesNotExist:
            return Response({'error': 'Invalid QR code.'}, status=status.HTTP_404_NOT_FOUND)
            
        if order.listing.donor != request.user:
            return Response({'error': 'Not authorized.'}, status=status.HTTP_403_FORBIDDEN)
            
        from django.utils import timezone
        
        if order.status not in [OrderStatus.PICKED_UP, OrderStatus.CANCELLED, OrderStatus.EXPIRED]:
            if order.listing.pickup_end and order.listing.pickup_end <= timezone.now():
                order.status = OrderStatus.EXPIRED
                order.save()
                
        if order.status == OrderStatus.EXPIRED:
            return Response({'error': 'This claim has expired.'}, status=status.HTTP_400_BAD_REQUEST)

        if order.status == OrderStatus.PICKED_UP:
            return Response({'error': 'Already picked up.'}, status=status.HTTP_400_BAD_REQUEST)
            
        if order.status == OrderStatus.CANCELLED:
            return Response({'error': 'This claim was cancelled.'}, status=status.HTTP_400_BAD_REQUEST)

        order.status = OrderStatus.PICKED_UP
        order.save()

        if order.requester.role == 'shelter' and order.listing.listing_type == 'DONATION':
            TaxReceipt.objects.get_or_create(
                order=order,
                defaults={
                    'donor': order.listing.donor,
                    'ngo': order.requester,
                    'listing': order.listing,
                    'estimated_value': order.listing.estimated_fmv,
                    'status': 'PENDING' if order.listing.is_ai_flagged else 'APPROVED'
                }
            )

        return Response({'status': 'Order completed successfully.', 'order_id': order.id})

    @action(detail=True, methods=['patch'])
    def cancel(self, request, pk=None):
        order = self.get_object()
        
        # Both donor and requester can cancel an order
        if order.listing.donor != request.user and order.requester != request.user:
            return Response({'error': 'Not authorized.'}, status=status.HTTP_403_FORBIDDEN)
            
        if order.status == OrderStatus.PICKED_UP:
            return Response({'error': 'Order cannot be cancelled in its current state.'}, status=status.HTTP_400_BAD_REQUEST)
            
        if order.status == OrderStatus.CANCELLED:
            return Response({'status': 'Order already cancelled.'})
            
        if order.status == OrderStatus.EXPIRED:
            return Response({'error': 'Order has already expired.'}, status=status.HTTP_400_BAD_REQUEST)

        order.status = OrderStatus.CANCELLED
        order.cancelled_by = request.user
        order.save()

        return Response({'status': 'Order cancelled successfully.'})

    @action(detail=True, methods=['patch'])
    def expire(self, request, pk=None):
        order = self.get_object()
        
        if order.status == OrderStatus.EXPIRED:
            return Response({'status': 'Order already expired.'})
            
        if order.status in [OrderStatus.PICKED_UP, OrderStatus.CANCELLED]:
            return Response({'error': 'Order cannot be expired in its current state.'}, status=status.HTTP_400_BAD_REQUEST)
            
        order.status = OrderStatus.EXPIRED
        order.save()

        return Response({'status': 'Order expired successfully.'})
