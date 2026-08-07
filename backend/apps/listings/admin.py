from django.contrib import admin
from .models import FoodListing

@admin.register(FoodListing)
class FoodListingAdmin(admin.ModelAdmin):
    list_display = ('title', 'donor', 'listing_type', 'discounted_price', 'quantity_available', 'is_active')
    list_filter = ('listing_type', 'is_active')
    search_fields = ('title', 'description', 'donor__username', 'donor__email')
    readonly_fields = ('created_at',)
