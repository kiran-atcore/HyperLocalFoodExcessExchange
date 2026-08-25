from django.db import models
from django.conf import settings
from apps.listings.models import FoodListing
from apps.orders.models import Order

class TaxReceiptStatus(models.TextChoices):
    PENDING = 'PENDING', 'Pending Admin Approval'
    APPROVED = 'APPROVED', 'Approved'
    REJECTED = 'REJECTED', 'Rejected'

class TaxReceipt(models.Model):
    donor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='tax_receipts_issued')
    ngo = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='tax_receipts_received')
    listing = models.ForeignKey(FoodListing, on_delete=models.CASCADE)
    order = models.OneToOneField(Order, on_delete=models.CASCADE)
    estimated_value = models.DecimalField(max_digits=8, decimal_places=2)
    status = models.CharField(max_length=20, choices=TaxReceiptStatus.choices, default=TaxReceiptStatus.APPROVED)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Receipt #{self.id} for {self.donor.business_name} - ${self.estimated_value}"
