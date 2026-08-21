from rest_framework import serializers
from .models import TaxReceipt
from django.contrib.auth import get_user_model
from apps.listings.models import FoodListing

User = get_user_model()

class TaxReceiptSerializer(serializers.ModelSerializer):
    ngo_name = serializers.SerializerMethodField()
    listing_title = serializers.CharField(source='listing.title', read_only=True)

    class Meta:
        model = TaxReceipt
        fields = ['id', 'ngo_name', 'listing_title', 'estimated_value', 'created_at']

    def get_ngo_name(self, obj):
        return obj.ngo.business_name if obj.ngo.business_name else obj.ngo.username
