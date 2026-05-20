from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _

from strategis.core.models import BaseModel
from strategis.utils.uploads import upload_to


class CEDCode(BaseModel):
    class Category(models.TextChoices):
        A = "A", "A"
        B = "B", "B"
        C = "C", "C"

    code = models.CharField(_("code"), max_length=20, unique=True)
    chapter_code = models.CharField(_("chapter code"), max_length=10)
    sub_category_code = models.CharField(_("sub-category code"), max_length=20)
    sub_category_label = models.TextField(_("sub-category label"))
    label = models.TextField(_("label"))
    is_hazardous = models.BooleanField(_("hazardous"), default=False)
    category = models.CharField(_("category"), max_length=1, choices=Category.choices)
    sub_category_a = models.CharField(_("sub-category A"), max_length=50, blank=True)
    sub_category_a_label = models.CharField(
        _("sub-category A label"),
        max_length=255,
        blank=True,
    )
    allowed_units = models.JSONField(_("allowed units"), default=list)
    points_per_unit = models.DecimalField(
        _("points per unit"),
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
    )
    reference_scenario = models.CharField(
        _("reference scenario"),
        max_length=20,
        blank=True,
    )
    is_active = models.BooleanField(_("active"), default=True)

    class Meta:
        ordering = ["code"]
        indexes = [
            models.Index(fields=["category"]),
            models.Index(fields=["sub_category_a"]),
        ]
        verbose_name = _("CED code")
        verbose_name_plural = _("CED codes")

    def __str__(self) -> str:
        return f"{self.code} — {self.label}"


class WasteLot(BaseModel):
    class Status(models.TextChoices):
        SUBMITTED = "submitted", _("Submitted")
        UNDER_VALIDATION = "under_validation", _("Under Validation")
        CORRECTION_REQUIRED = "correction_required", _("Correction Required")
        VALIDATED = "validated", _("Validated")
        CATEGORIZED = "categorized", _("Categorized")
        ROUTES_IDENTIFIED = "routes_identified", _("Routes Identified")
        NO_ROUTE_AVAILABLE = "no_route_available", _("No Route Available")
        CATEGORIZATION_ERROR = "categorization_error", _("Categorization Error")

    producer = models.ForeignKey(
        "profiles.Actor",
        on_delete=models.PROTECT,
        related_name="waste_lots",
        verbose_name=_("producer"),
    )
    ced_code = models.ForeignKey(
        CEDCode,
        on_delete=models.PROTECT,
        related_name="waste_lots",
        verbose_name=_("CED code"),
    )
    description = models.TextField(_("description"))
    quantity = models.DecimalField(_("quantity"), max_digits=12, decimal_places=2)
    unit = models.CharField(_("unit"), max_length=20)
    address = models.TextField(_("address"))
    latitude = models.DecimalField(
        _("latitude"),
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True,
    )
    longitude = models.DecimalField(
        _("longitude"),
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True,
    )
    availability_date = models.DateField(_("availability date"))
    additional_info = models.TextField(_("additional info"), blank=True)
    status = models.CharField(
        _("status"),
        max_length=25,
        choices=Status.choices,
        default=Status.SUBMITTED,
    )
    admin_correction_note = models.TextField(_("admin correction note"), blank=True)
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reviewed_lots",
        verbose_name=_("reviewed by"),
    )
    reviewed_at = models.DateTimeField(_("reviewed at"), null=True, blank=True)
    rejection_reason = models.TextField(_("rejection reason"), blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["status"]),
            models.Index(fields=["producer_id"]),
        ]
        verbose_name = _("waste lot")
        verbose_name_plural = _("waste lots")

    def __str__(self) -> str:
        return f"{self.ced_code.code} — {self.producer}"


class WasteLotPhoto(models.Model):
    id = models.AutoField(primary_key=True)
    lot = models.ForeignKey(
        WasteLot,
        on_delete=models.CASCADE,
        related_name="photos",
        verbose_name=_("lot"),
    )
    file = models.ImageField(_("file"), upload_to=upload_to)
    uploaded_at = models.DateTimeField(_("uploaded at"), auto_now_add=True)

    class Meta:
        verbose_name = _("waste lot photo")
        verbose_name_plural = _("waste lot photos")

    def __str__(self) -> str:
        return f"Photo {self.id} — lot {self.lot_id}"


class LotCategorization(BaseModel):
    class Category(models.TextChoices):
        A = "A", "A"
        B = "B", "B"
        C = "C", "C"

    lot = models.OneToOneField(
        WasteLot,
        on_delete=models.CASCADE,
        related_name="categorization",
        verbose_name=_("lot"),
    )
    category = models.CharField(_("category"), max_length=1, choices=Category.choices)
    sub_category_a = models.CharField(_("sub-category A"), max_length=50, blank=True)
    potential_points = models.DecimalField(
        _("potential points"),
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
    )
    categorized_at = models.DateTimeField(_("categorized at"), auto_now_add=True)
    error_message = models.TextField(_("error message"), blank=True)

    class Meta:
        verbose_name = _("lot categorization")
        verbose_name_plural = _("lot categorizations")

    def __str__(self) -> str:
        return f"{self.lot} — {self.category}"
