from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'role', 'business_name', 'is_staff')
    fieldsets = UserAdmin.fieldsets + (
        ('Profile', {'fields': ('role', 'business_name', 'phone_number', 'address', 'latitude', 'longitude')}),
    )
