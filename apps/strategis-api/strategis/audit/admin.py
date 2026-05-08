from django.contrib import admin

from .models import AuditLog


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = (
        "action",
        "object_type",
        "object_id",
        "user",
        "ip_address",
        "timestamp",
    )
    list_filter = ("action", "object_type")
    search_fields = ("action", "object_type", "object_id")
    readonly_fields = (
        "user",
        "action",
        "object_type",
        "object_id",
        "detail",
        "ip_address",
        "timestamp",
    )

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
