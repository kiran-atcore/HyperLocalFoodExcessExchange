from django.contrib import admin
from .models import FoodListing

@admin.register(FoodListing)
class FoodListingAdmin(admin.ModelAdmin):
    list_display = ('title', 'donor', 'listing_type', 'quantity_available', 'pickup_end', 'created_at')
    list_filter = ('listing_type', 'donor', 'created_at')
    search_fields = ('title', 'description', 'donor__business_name')
