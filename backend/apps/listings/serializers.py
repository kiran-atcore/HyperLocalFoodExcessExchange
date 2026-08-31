import base64
import uuid
from django.core.files.base import ContentFile
from rest_framework import serializers
from .models import FoodListing

class Base64ImageField(serializers.ImageField):
    def to_internal_value(self, data):
        if data == "" or data is None:
            return None
        if isinstance(data, str) and data.startswith('data:image'):
            format_str, imgstr = data.split(';base64,')
            ext = format_str.split('/')[-1]
            if ext == 'jpeg':
                ext = 'jpg'
            file_name = f"{uuid.uuid4().hex[:10]}.{ext}"
            data = ContentFile(base64.b64decode(imgstr), name=file_name)
        elif isinstance(data, str) and (data.startswith('http://') or data.startswith('https://') or data.startswith('/media/')):
            return serializers.SkipField()
        return super().to_internal_value(data)

class FoodListingSerializer(serializers.ModelSerializer):
    image = Base64ImageField(required=False, allow_null=True)
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

