from rest_framework import viewsets, permissions, status, filters, generics
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Order, OrderStatus
from .serializers import OrderSerializer
from apps.tax_receipts.models import TaxReceipt

class AdminOrderListView(generics.ListAPIView):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role != 'admin':
            return Order.objects.none()
            
        queryset = Order.objects.all().order_by('-created_at')
        
        order_status = self.request.query_params.get('status')
        if order_status:
            queryset = queryset.filter(status=order_status)
            
        return queryset

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
                
            requested_quantity = int(request.data.get('quantity', 1))

            if listing.listing_type == 'DONATION':
                if listing.orders.exclude(status__in=['CANCELLED', 'EXPIRED']).exists():
                    return Response({'error': 'This donation has already been claimed by another shelter.'}, status=status.HTTP_400_BAD_REQUEST)
                requested_quantity = listing.quantity_available
            else:
                from django.db.models import Sum
                total_ordered = listing.orders.exclude(status__in=['CANCELLED', 'EXPIRED']).aggregate(Sum('quantity'))['quantity__sum'] or 0
                remaining = listing.quantity_available - total_ordered
                if remaining <= 0:
                     return Response({'error': 'This deal is fully claimed.'}, status=status.HTTP_400_BAD_REQUEST)
                if requested_quantity > remaining:
                    return Response({'error': f'Not enough quantity available. Only {remaining} left.'}, status=status.HTTP_400_BAD_REQUEST)
                if requested_quantity < 1:
                     return Response({'error': 'Quantity must be at least 1.'}, status=status.HTTP_400_BAD_REQUEST)
            
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer, requested_quantity)
            headers = self.get_success_headers(serializer.data)
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def perform_create(self, serializer, quantity=1):
        serializer.save(requester=self.request.user, quantity=quantity)

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
        order.picked_up_at = timezone.now()
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
            
        from django.core.exceptions import ValidationError
        import uuid
        try:
            # Check if it's a valid UUID
            uuid_obj = uuid.UUID(str(qr_code_id))
            order = Order.objects.get(qr_code_id=uuid_obj)
        except (ValueError, ValidationError):
            # Fallback for old orders where QR code might be the ID
            try:
                order = Order.objects.get(id=int(qr_code_id))
            except (ValueError, Order.DoesNotExist):
                return Response({'error': 'Invalid QR code.'}, status=status.HTTP_404_NOT_FOUND)
        except Order.DoesNotExist:
            return Response({'error': 'Invalid QR code.'}, status=status.HTTP_404_NOT_FOUND)
            
        if order.listing.donor != request.user:
            return Response({'error': 'Not authorized.'}, status=status.HTTP_403_FORBIDDEN)
            
        expected_order_id = request.data.get('expected_order_id')
        if expected_order_id and str(order.id) != str(expected_order_id):
            return Response({'error': 'The scanned QR code does not match this specific pickup request.'}, status=status.HTTP_400_BAD_REQUEST)

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
        order.picked_up_at = timezone.now()
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

        return Response({
            'status': 'Order cancelled successfully.',
            'order': self.get_serializer(order).data
        })

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
