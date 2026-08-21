from django.contrib import admin
from .models import TaxReceipt

@admin.register(TaxReceipt)
class TaxReceiptAdmin(admin.ModelAdmin):
    list_display = ('id', 'donor', 'ngo', 'estimated_value', 'created_at')
    list_filter = ('created_at', 'donor', 'ngo')
    search_fields = ('id', 'donor__business_name', 'ngo__business_name', 'listing__title')
    readonly_fields = ('id', 'created_at')
