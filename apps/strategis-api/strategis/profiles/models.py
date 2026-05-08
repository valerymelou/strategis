from django.conf import settings
from django.contrib.gis.db.models import PointField
from django.db import models
from django.utils.translation import gettext_lazy as _

from strategis.core.models import BaseModel
from strategis.utils.uploads import upload_to


class ActorType(BaseModel):
    name = models.CharField(_("name"), max_length=100)
    slug = models.SlugField(_("slug"), unique=True)
    description = models.TextField(_("description"), blank=True)
    requires_validation = models.BooleanField(_("requires validation"), default=True)
    is_active = models.BooleanField(_("active"), default=True)
    required_documents = models.JSONField(
        _("required documents"),
        default=list,
        help_text=_(
            "List of required documents, e.g. "
            '[{"label": "...", "required": true, "accepted_formats": ["pdf", "jpg"]}]',
        ),
    )

    class Meta:
        verbose_name = _("actor type")
        verbose_name_plural = _("actor types")
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name


class ProfessionalProfile(BaseModel):
    class EntityType(models.TextChoices):
        INDIVIDUAL = "individual", _("Individual")
        COMPANY = "company", _("Company")
        NGO = "ngo", _("NGO")
        PUBLIC_INSTITUTION = "public_institution", _("Public Institution")
        OTHER = "other", _("Other")

    class Tier(models.TextChoices):
        FREE = "free", _("Free")
        PREMIUM = "premium", _("Premium")

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="professional_profile",
        verbose_name=_("user"),
    )
    company_name = models.CharField(_("company name"), max_length=255)
    entity_type = models.CharField(
        _("entity type"),
        max_length=20,
        choices=EntityType.choices,
    )
    company_registration_number = models.CharField(
        _("company registration number"),
        max_length=100,
        blank=True,
    )
    tax_id_number = models.CharField(_("tax ID number"), max_length=100)
    phone = models.CharField(_("phone"), max_length=30)
    address = models.TextField(_("address"), blank=True)
    intervention_zone = models.CharField(
        _("intervention zone"),
        max_length=255,
        blank=True,
    )
    location = PointField(
        _("location"),
        geography=True,
        srid=4326,
        null=True,
        blank=True,
        help_text=_("Geographic position (longitude, latitude) in WGS84"),
    )
    tier = models.CharField(
        _("tier"),
        max_length=10,
        choices=Tier.choices,
        default=Tier.FREE,
    )
    is_active = models.BooleanField(_("active"), default=True)

    class Meta:
        verbose_name = _("professional profile")
        verbose_name_plural = _("professional profiles")
        ordering = ["company_name"]

    def __str__(self) -> str:
        return self.company_name


class PremiumUpgradeRequest(BaseModel):
    class Status(models.TextChoices):
        PENDING = "pending", _("Pending")
        ACTIVATED = "activated", _("Activated")
        REJECTED = "rejected", _("Rejected")
        EXPIRED = "expired", _("Expired")

    class Plan(models.TextChoices):
        MONTHLY = "monthly", _("Monthly")
        ANNUAL = "annual", _("Annual")

    profile = models.ForeignKey(
        ProfessionalProfile,
        on_delete=models.CASCADE,
        related_name="premium_requests",
        verbose_name=_("profile"),
    )
    status = models.CharField(
        _("status"),
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
    )
    plan = models.CharField(
        _("plan"),
        max_length=10,
        choices=Plan.choices,
        blank=True,
        default="",
    )
    activated_at = models.DateTimeField(_("activated at"), null=True, blank=True)
    expires_at = models.DateTimeField(_("expires at"), null=True, blank=True)
    rejected_at = models.DateTimeField(_("rejected at"), null=True, blank=True)
    rejection_reason = models.TextField(_("rejection reason"), blank=True)
    admin_note = models.TextField(_("admin note"), blank=True)
    activated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="activated_premium_requests",
        verbose_name=_("activated by"),
    )

    class Meta:
        verbose_name = _("premium upgrade request")
        verbose_name_plural = _("premium upgrade requests")
        ordering = ["-created"]

    def __str__(self) -> str:
        return f"{self.profile} ({self.get_status_display()})"


class Actor(BaseModel):
    class Status(models.TextChoices):
        PENDING = "pending", _("Pending")
        ACTIVE = "active", _("Active")
        REJECTED = "rejected", _("Rejected")
        REVOKED = "revoked", _("Revoked")
        AWAITING_DOCUMENTS = "awaiting_documents", _("Awaiting Documents")

    class ProcessingDelay(models.TextChoices):
        IMMEDIATE = "immediate", _("Immediate")
        WITHIN_48H = "within_48h", _("Within 48h")
        WITHIN_7_DAYS = "within_7_days", _("Within 7 Days")
        OVER_7_DAYS = "over_7_days", _("Over 7 Days")
        UNCERTAIN = "uncertain", _("Uncertain")

    class ReliabilityLevel(models.TextChoices):
        CERTIFIED = "certified", _("Certified")
        VALIDATED_GOOD_HISTORY = "validated_good_history", _("Validated - Good History")
        VALIDATED = "validated", _("Validated")
        DECLARED = "declared", _("Declared")
        NOT_VALIDATED = "not_validated", _("Not Validated")

    class ComplianceLevel(models.TextChoices):
        APPROVED = "approved", _("Approved")
        VALIDATED = "validated", _("Validated")
        COMPLIANT = "compliant", _("Compliant")
        AT_RISK = "at_risk", _("At Risk")
        NON_COMPLIANT = "non_compliant", _("Non-Compliant")

    profile = models.ForeignKey(
        ProfessionalProfile,
        on_delete=models.CASCADE,
        related_name="actors",
        verbose_name=_("profile"),
    )
    actor_type = models.ForeignKey(
        ActorType,
        on_delete=models.PROTECT,
        related_name="actors",
        verbose_name=_("actor type"),
    )
    status = models.CharField(
        _("status"),
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
    )
    is_available = models.BooleanField(_("available"), default=True)
    operation_radius_km = models.PositiveIntegerField(
        _("operation radius (km)"),
        null=True,
        blank=True,
    )
    max_quantity = models.DecimalField(
        _("max quantity"),
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
    )
    max_quantity_unit = models.CharField(
        _("max quantity unit"),
        max_length=20,
        blank=True,
    )
    processing_delay = models.CharField(
        _("processing delay"),
        max_length=20,
        choices=ProcessingDelay.choices,
        blank=True,
    )
    reliability_level = models.CharField(
        _("reliability level"),
        max_length=25,
        choices=ReliabilityLevel.choices,
        blank=True,
    )
    compliance_level = models.CharField(
        _("compliance level"),
        max_length=20,
        choices=ComplianceLevel.choices,
        blank=True,
    )
    approved_for_category_c = models.BooleanField(
        _("approved for category C"),
        default=False,
    )
    variants = models.JSONField(_("variants"), default=list)
    validated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="validated_actors",
        verbose_name=_("validated by"),
    )
    validated_at = models.DateTimeField(_("validated at"), null=True, blank=True)
    rejection_reason = models.TextField(_("rejection reason"), blank=True)
    revocation_reason = models.TextField(_("revocation reason"), blank=True)

    class Meta:
        verbose_name = _("actor")
        verbose_name_plural = _("actors")
        ordering = ["-created"]

    def __str__(self) -> str:
        return f"{self.profile} - {self.actor_type}"


class ActorDocument(BaseModel):
    actor = models.ForeignKey(
        Actor,
        on_delete=models.CASCADE,
        related_name="documents",
        verbose_name=_("actor"),
    )
    label = models.CharField(_("label"), max_length=255)
    file = models.FileField(_("file"), upload_to=upload_to)
    is_required = models.BooleanField(_("required"), default=True)
    uploaded_at = models.DateTimeField(_("uploaded at"), auto_now_add=True)
    admin_note = models.TextField(_("admin note"), blank=True)

    class Meta:
        verbose_name = _("actor document")
        verbose_name_plural = _("actor documents")
        ordering = ["uploaded_at"]

    def __str__(self) -> str:
        return self.label
