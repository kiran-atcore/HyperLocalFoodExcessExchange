from rest_framework import serializers
from .models import FoodListing

class FoodListingSerializer(serializers.ModelSerializer):
    is_claimed = serializers.SerializerMethodField()
    donor_status = serializers.SerializerMethodField()
    donor_name = serializers.CharField(source='donor.business_name', read_only=True)
    donor_latitude = serializers.FloatField(source='donor.latitude', read_only=True)
    donor_longitude = serializers.FloatField(source='donor.longitude', read_only=True)

    class Meta:
        model = FoodListing
        fields = '__all__'
        read_only_fields = ('donor', 'created_at')

    def get_is_claimed(self, obj):
        return obj.orders.exclude(status__in=['CANCELLED', 'EXPIRED']).exists()
        
    def get_donor_status(self, obj):
        first_order = obj.orders.exclude(status__in=['CANCELLED', 'EXPIRED']).first()
        if not first_order:
            return 'Active'
        if first_order.status == 'PICKED_UP':
            return 'Picked Up'
        return 'Claimed'
