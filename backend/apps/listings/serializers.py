from rest_framework import serializers
from .models import FoodListing

class FoodListingSerializer(serializers.ModelSerializer):
    is_claimed = serializers.SerializerMethodField()
    quantity_remaining = serializers.SerializerMethodField()
    donor_status = serializers.SerializerMethodField()
    donor_name = serializers.CharField(source='donor.business_name', read_only=True)
    donor_latitude = serializers.FloatField(source='donor.latitude', read_only=True)
    donor_longitude = serializers.FloatField(source='donor.longitude', read_only=True)

    class Meta:
        model = FoodListing
        fields = '__all__'
        read_only_fields = ('donor', 'created_at')

    def get_is_claimed(self, obj):
        if obj.listing_type == 'DONATION':
            return obj.orders.exclude(status__in=['CANCELLED', 'EXPIRED']).exists()
        from django.db.models import Sum
        total_ordered = obj.orders.exclude(status__in=['CANCELLED', 'EXPIRED']).aggregate(Sum('quantity'))['quantity__sum'] or 0
        return total_ordered >= obj.quantity_available

    def get_quantity_remaining(self, obj):
        from django.db.models import Sum
        total_ordered = obj.orders.exclude(status__in=['CANCELLED', 'EXPIRED']).aggregate(Sum('quantity'))['quantity__sum'] or 0
        remaining = obj.quantity_available - total_ordered
        return remaining if remaining > 0 else 0
        
    def get_donor_status(self, obj):
        active_orders = obj.orders.exclude(status__in=['CANCELLED', 'EXPIRED'])
        
        if self.get_is_claimed(obj):
            # Check if there are active orders and ALL of them are PICKED_UP
            if active_orders.exists() and not active_orders.exclude(status='PICKED_UP').exists():
                return 'Picked Up'
            return 'Claimed'
        
        # Partially sold?
        if obj.listing_type == 'DISCOUNT':
            from django.db.models import Sum
            total = active_orders.aggregate(Sum('quantity'))['quantity__sum'] or 0
            if total > 0:
                return 'Partially Sold'

        return 'Active'

