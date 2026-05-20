from django.contrib import admin

from .models import CEDCode
from .models import LotCategorization
from .models import WasteLot
from .models import WasteLotPhoto


@admin.register(CEDCode)
class CEDCodeAdmin(admin.ModelAdmin):
    list_display = [
        "code",
        "label",
        "category",
        "sub_category_a",
        "is_hazardous",
        "is_active",
    ]
    list_filter = ["category", "is_hazardous", "is_active"]
    search_fields = ["code", "label", "sub_category_label"]


@admin.register(WasteLot)
class WasteLotAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "producer",
        "ced_code",
        "quantity",
        "unit",
        "status",
        "availability_date",
    ]
    list_filter = ["status"]
    search_fields = ["description", "ced_code__code", "address"]


@admin.register(WasteLotPhoto)
class WasteLotPhotoAdmin(admin.ModelAdmin):
    list_display = ["id", "lot", "uploaded_at"]
    list_filter = ["uploaded_at"]
    search_fields = ["lot__id"]


@admin.register(LotCategorization)
class LotCategorizationAdmin(admin.ModelAdmin):
    list_display = [
        "lot",
        "category",
        "sub_category_a",
        "potential_points",
        "categorized_at",
    ]
    list_filter = ["category"]
    search_fields = ["lot__id", "error_message"]
