from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.translation import gettext_lazy as _
from .models import User, ActivityLog

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ('email', 'first_name', 'role', 'business_name', 'is_staff')
    ordering = ('email',)
    search_fields = ('email', 'first_name', 'last_name', 'business_name')

    fieldsets = (
        (None, {"fields": ("email", "password")}),
        (_("Personal info"), {"fields": ("first_name", "last_name")}),
        (_("Permissions"), {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")}),
        (_("Important dates"), {"fields": ("last_login", "date_joined")}),
        ('Profile', {'fields': ('role', 'business_name', 'phone_number', 'address', 'latitude', 'longitude', 'is_approved', 'approval_status')}),
    )

    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("email", "password"),
        }),
    )

@admin.register(ActivityLog)
class ActivityLogAdmin(admin.ModelAdmin):
    list_display = ('text', 'type', 'related_user', 'timestamp')
    list_filter = ('type', 'timestamp')
    search_fields = ('text', 'related_user__email', 'related_user__business_name')
