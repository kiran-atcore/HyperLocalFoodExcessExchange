from django.db import models
from django.conf import settings

class FoodListing(models.Model):
    class ListingType(models.TextChoices):
        DONATION = 'DONATION', '100% Free NGO Donation'
        DISCOUNT = 'DISCOUNT', 'Discounted Consumer Sale'

    donor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='listings')
    title = models.CharField(max_length=255)
    description = models.TextField()
    listing_type = models.CharField(max_length=20, choices=ListingType.choices, default=ListingType.DISCOUNT)
    
    original_price = models.DecimalField(max_digits=6, decimal_places=2)
    discounted_price = models.DecimalField(max_digits=6, decimal_places=2, default=0.00)
    estimated_fmv = models.DecimalField(max_digits=6, decimal_places=2, help_text="Fair Market Value for Tax Receipt")
    
    quantity_available = models.PositiveIntegerField(default=1)
    quantity_unit = models.CharField(max_length=20, default='portions')
    dietary_info = models.CharField(max_length=50, default='None')
    additional_details = models.TextField(blank=True, null=True)
    
    # Geolocation standard float fields for pure SQLite support
    latitude = models.FloatField()
    longitude = models.FloatField()
    pickup_address = models.CharField(max_length=255)
    
    pickup_start = models.DateTimeField()
    pickup_end = models.DateTimeField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

