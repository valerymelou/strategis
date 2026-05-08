from django.contrib import admin
from django.contrib.gis.admin import GISModelAdmin
from django.utils.translation import gettext_lazy as _
from modeltranslation.admin import TranslationAdmin

from .models import Actor
from .models import ActorDocument
from .models import ActorType
from .models import PremiumUpgradeRequest
from .models import ProfessionalProfile


class PremiumUpgradeRequestInline(admin.StackedInline):
    model = PremiumUpgradeRequest
    extra = 0
    readonly_fields = ("activated_at", "rejected_at", "expires_at", "activated_by")
    fieldsets = (
        (None, {"fields": ("status", "plan")}),
        (
            _("Activation"),
            {
                "fields": ("activated_at", "expires_at", "activated_by"),
                "classes": ("collapse",),
            },
        ),
        (
            _("Rejection"),
            {"fields": ("rejected_at", "rejection_reason"), "classes": ("collapse",)},
        ),
        (_("Notes"), {"fields": ("admin_note",), "classes": ("collapse",)}),
    )


class ActorInline(admin.TabularInline):
    model = Actor
    extra = 0
    fields = (
        "actor_type",
        "status",
        "is_available",
        "reliability_level",
        "compliance_level",
    )
    show_change_link = True


class ActorDocumentInline(admin.TabularInline):
    model = ActorDocument
    extra = 0
    fields = ("label", "file", "is_required", "uploaded_at", "admin_note")
    readonly_fields = ("uploaded_at",)


@admin.register(ProfessionalProfile)
class ProfessionalProfileAdmin(GISModelAdmin):
    list_display = ("company_name", "entity_type", "tier", "is_active", "user")
    list_filter = ("entity_type", "tier", "is_active")
    search_fields = ("company_name", "user__email", "tax_id_number", "phone")
    ordering = ("company_name",)
    raw_id_fields = ("user",)
    inlines = [PremiumUpgradeRequestInline, ActorInline]
    fieldsets = (
        (
            _("Identity"),
            {
                "fields": (
                    "user",
                    "company_name",
                    "entity_type",
                    "company_registration_number",
                    "tax_id_number",
                ),
            },
        ),
        (_("Contact"), {"fields": ("phone", "address", "intervention_zone")}),
        (_("Geographic position"), {"fields": ("location",)}),
        (_("Subscription"), {"fields": ("tier", "is_active")}),
    )
    date_hierarchy = "created"


@admin.register(ActorType)
class ActorTypeAdmin(TranslationAdmin):
    list_display = ("name", "slug", "requires_validation", "is_active")
    list_filter = ("requires_validation", "is_active")
    search_fields = ("name", "slug")
    prepopulated_fields = {"slug": ("name_en",)}
    fieldsets = (
        (None, {"fields": ("name", "slug", "description")}),
        (
            _("Configuration"),
            {"fields": ("requires_validation", "is_active", "required_documents")},
        ),
    )


@admin.register(PremiumUpgradeRequest)
class PremiumUpgradeRequestAdmin(admin.ModelAdmin):
    list_display = (
        "profile",
        "status",
        "plan",
        "activated_at",
        "expires_at",
        "activated_by",
    )
    list_filter = ("status", "plan")
    search_fields = ("profile__company_name",)
    raw_id_fields = ("profile", "activated_by")
    readonly_fields = ("activated_at", "rejected_at")
    fieldsets = (
        (None, {"fields": ("profile", "status", "plan")}),
        (_("Activation"), {"fields": ("activated_at", "expires_at", "activated_by")}),
        (_("Rejection"), {"fields": ("rejected_at", "rejection_reason")}),
        (_("Notes"), {"fields": ("admin_note",)}),
    )
    date_hierarchy = "created"


@admin.register(Actor)
class ActorAdmin(admin.ModelAdmin):
    list_display = (
        "profile",
        "actor_type",
        "status",
        "is_available",
        "reliability_level",
        "compliance_level",
        "approved_for_category_c",
    )
    list_filter = (
        "status",
        "actor_type",
        "is_available",
        "reliability_level",
        "compliance_level",
        "approved_for_category_c",
    )
    search_fields = ("profile__company_name", "actor_type__name")
    raw_id_fields = ("profile", "validated_by")
    readonly_fields = ("validated_at", "validated_by")
    inlines = [ActorDocumentInline]
    fieldsets = (
        (None, {"fields": ("profile", "actor_type", "status", "is_available")}),
        (
            _("Capacity"),
            {
                "fields": (
                    "operation_radius_km",
                    "max_quantity",
                    "max_quantity_unit",
                    "processing_delay",
                    "variants",
                ),
            },
        ),
        (
            _("Compliance & reliability"),
            {
                "fields": (
                    "reliability_level",
                    "compliance_level",
                    "approved_for_category_c",
                ),
            },
        ),
        (
            _("Validation"),
            {
                "fields": (
                    "validated_by",
                    "validated_at",
                    "rejection_reason",
                    "revocation_reason",
                ),
                "classes": ("collapse",),
            },
        ),
    )
    date_hierarchy = "created"


@admin.register(ActorDocument)
class ActorDocumentAdmin(admin.ModelAdmin):
    list_display = ("label", "actor", "is_required", "uploaded_at")
    list_filter = ("is_required",)
    search_fields = ("label", "actor__profile__company_name")
    raw_id_fields = ("actor",)
    readonly_fields = ("uploaded_at",)
