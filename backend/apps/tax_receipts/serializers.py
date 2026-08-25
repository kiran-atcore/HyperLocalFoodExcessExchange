from rest_framework import serializers
from .models import TaxReceipt
from django.contrib.auth import get_user_model
from apps.listings.models import FoodListing

User = get_user_model()

class TaxReceiptSerializer(serializers.ModelSerializer):
    ngo_name = serializers.SerializerMethodField()
    listing_title = serializers.CharField(source='listing.title', read_only=True)
    listing_description = serializers.CharField(source='listing.description', read_only=True)
    ai_suggested_value = serializers.DecimalField(source='listing.ai_suggested_value', max_digits=8, decimal_places=2, read_only=True)
    ai_valuation_report = serializers.JSONField(source='listing.ai_valuation_report', read_only=True)
    is_ai_flagged = serializers.BooleanField(source='listing.is_ai_flagged', read_only=True)
    donor_details = serializers.SerializerMethodField()
    ngo_details = serializers.SerializerMethodField()

    class Meta:
        model = TaxReceipt
        fields = [
            'id', 'ngo_name', 'listing_title', 'listing_description', 
            'estimated_value', 'status', 'ai_suggested_value', 'ai_valuation_report', 'is_ai_flagged', 
            'donor_details', 'ngo_details', 'created_at'
        ]

    def get_ngo_name(self, obj):
        return obj.ngo.business_name if obj.ngo.business_name else obj.ngo.username

    def get_donor_details(self, obj):
        return {
            'name': obj.donor.business_name or obj.donor.username,
            'email': obj.donor.email,
            'phone': obj.donor.phone_number or 'Not provided',
        }

    def get_ngo_details(self, obj):
        return {
            'name': obj.ngo.business_name or obj.ngo.username,
            'email': obj.ngo.email,
            'phone': obj.ngo.phone_number or 'Not provided',
        }
