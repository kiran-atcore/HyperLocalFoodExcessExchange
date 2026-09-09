from rest_framework import serializers
from .models import Order
from apps.listings.models import FoodListing
from django.contrib.auth import get_user_model

User = get_user_model()

class SimpleListingSerializer(serializers.ModelSerializer):
    donor_name = serializers.CharField(source='donor.business_name', read_only=True)
    donor_phone = serializers.CharField(source='donor.phone_number', read_only=True)
    donor_latitude = serializers.FloatField(source='donor.latitude', read_only=True)
    donor_longitude = serializers.FloatField(source='donor.longitude', read_only=True)
    quantity_remaining = serializers.SerializerMethodField()
    
    class Meta:
        model = FoodListing
        fields = ['id', 'title', 'listing_type', 'quantity_available', 'quantity_remaining', 'quantity_unit', 'latitude', 'longitude', 'donor_name', 'donor_phone', 'pickup_end', 'donor_latitude', 'donor_longitude', 'estimated_fmv', 'original_price', 'discounted_price']

    def get_quantity_remaining(self, obj):
        from django.db.models import Sum
        total_ordered = obj.orders.exclude(status__in=['CANCELLED', 'EXPIRED']).aggregate(Sum('quantity'))['quantity__sum'] or 0
        remaining = obj.quantity_available - total_ordered
        return remaining if remaining > 0 else 0

class SimpleUserSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    profile_picture = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'name', 'role', 'email', 'phone_number', 'profile_picture']
        
    def get_name(self, obj):
        return obj.business_name if obj.business_name else obj.first_name

    def get_profile_picture(self, obj):
        if obj.profile_picture:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.profile_picture.url)
            return obj.profile_picture.url
        return None

class OrderSerializer(serializers.ModelSerializer):
    listing_details = SimpleListingSerializer(source='listing', read_only=True)
    donor_phone = serializers.CharField(source='listing.donor.phone_number', read_only=True)
    requester_details = SimpleUserSerializer(source='requester', read_only=True)
    cancelled_by_details = SimpleUserSerializer(source='cancelled_by', read_only=True)

    class Meta:
        model = Order
        fields = ['id', 'listing', 'listing_details', 'donor_phone', 'requester', 'requester_details', 'cancelled_by', 'cancelled_by_details', 'qr_code_id', 'status', 'eta', 'created_at', 'quantity']
        read_only_fields = ['status', 'created_at', 'requester', 'cancelled_by', 'qr_code_id', 'quantity']
