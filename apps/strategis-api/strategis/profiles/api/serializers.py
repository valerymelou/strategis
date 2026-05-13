from __future__ import annotations

from django.utils.translation import gettext_lazy as _
from rest_framework_json_api import serializers
from rest_framework_json_api.relations import ResourceRelatedField

from strategis.core.api.serializers import BaseSerializer
from strategis.profiles.models import Actor
from strategis.profiles.models import ActorDocument
from strategis.profiles.models import ActorType
from strategis.profiles.models import PremiumUpgradeRequest
from strategis.profiles.models import ProfessionalProfile

# ---------------------------------------------------------------------------
# ActorType
# ---------------------------------------------------------------------------


class ActorTypeSerializer(BaseSerializer):
    class Meta:
        model = ActorType
        fields = [
            "id",
            "name",
            "slug",
            "description",
            "requires_validation",
            "required_documents",
            "is_active",
        ]
        read_only_fields = fields

    class JSONAPIMeta:
        resource_name = "ActorType"


# ---------------------------------------------------------------------------
# ProfessionalProfile
# ---------------------------------------------------------------------------


class ProfessionalProfileSerializer(BaseSerializer):
    """Full read serializer — includes relationship links."""

    actors = ResourceRelatedField(many=True, read_only=True)
    premium_requests = ResourceRelatedField(
        many=True,
        read_only=True,
        model=PremiumUpgradeRequest,
    )

    included_serializers = {
        "actors": "strategis.profiles.api.serializers.ActorSerializer",
    }

    class Meta:
        model = ProfessionalProfile
        fields = [
            "id",
            "company_name",
            "entity_type",
            "company_registration_number",
            "tax_id_number",
            "phone",
            "address",
            "intervention_zone",
            "location",
            "tier",
            "is_active",
            "created",
            "modified",
            "actors",
            "premium_requests",
        ]
        read_only_fields = ["id", "tier", "is_active", "created", "modified"]

    class JSONAPIMeta:
        resource_name = "ProfessionalProfile"


class ProfessionalProfileCreateSerializer(BaseSerializer):
    """Write serializer for POST /professional-profiles/.

    Accepts an optional ``tier`` field (free|premium). The value is not stored
    directly on the model — it is read by the service layer.
    """

    tier_requested = serializers.ChoiceField(
        choices=ProfessionalProfile.Tier.choices,
        default=ProfessionalProfile.Tier.FREE,
        write_only=True,
        required=False,
    )

    class Meta:
        model = ProfessionalProfile
        fields = [
            "id",
            "company_name",
            "entity_type",
            "company_registration_number",
            "tax_id_number",
            "phone",
            "address",
            "intervention_zone",
            "location",
            "tier_requested",
        ]
        read_only_fields = ["id"]

    class JSONAPIMeta:
        resource_name = "ProfessionalProfile"

    def validate(self, attrs):
        entity_type = attrs.get("entity_type", "")
        company_reg = attrs.get("company_registration_number", "")
        requires_reg = {
            ProfessionalProfile.EntityType.COMPANY,
            ProfessionalProfile.EntityType.NGO,
            ProfessionalProfile.EntityType.PUBLIC_INSTITUTION,
        }
        if entity_type in requires_reg and not company_reg:
            raise serializers.ValidationError(
                {
                    "company_registration_number": _(
                        "This field is required for your entity type.",
                    ),
                },
            )
        return attrs


class ProfessionalProfileUpdateSerializer(BaseSerializer):
    """PATCH serializer — only allows the user-patchable fields."""

    class Meta:
        model = ProfessionalProfile
        fields = [
            "id",
            "company_name",
            "phone",
            "address",
            "intervention_zone",
            "location",
        ]
        read_only_fields = ["id"]

    class JSONAPIMeta:
        resource_name = "ProfessionalProfile"


# ---------------------------------------------------------------------------
# PremiumUpgradeRequest
# ---------------------------------------------------------------------------


class PremiumUpgradeRequestSerializer(BaseSerializer):
    profile = ResourceRelatedField(read_only=True)

    class Meta:
        model = PremiumUpgradeRequest
        fields = [
            "id",
            "profile",
            "status",
            "plan",
            "activated_at",
            "expires_at",
            "rejected_at",
            "rejection_reason",
            "created",
            "modified",
        ]
        read_only_fields = fields

    class JSONAPIMeta:
        resource_name = "PremiumUpgradeRequest"


class PremiumActivateSerializer(serializers.Serializer):
    plan = serializers.ChoiceField(choices=PremiumUpgradeRequest.Plan.choices)


class PremiumRejectSerializer(serializers.Serializer):
    rejection_reason = serializers.CharField(min_length=1)


# ---------------------------------------------------------------------------
# Actor
# ---------------------------------------------------------------------------


class ActorSerializer(BaseSerializer):
    profile = ResourceRelatedField(read_only=True)
    actor_type = ResourceRelatedField(read_only=True)
    documents = ResourceRelatedField(many=True, read_only=True)

    class Meta:
        model = Actor
        fields = [
            "id",
            "profile",
            "actor_type",
            "status",
            "is_available",
            "operation_radius_km",
            "max_quantity",
            "max_quantity_unit",
            "processing_delay",
            "reliability_level",
            "compliance_level",
            "approved_for_category_c",
            "variants",
            "validated_at",
            "rejection_reason",
            "revocation_reason",
            "created",
            "modified",
            "documents",
        ]
        read_only_fields = [
            "id",
            "profile",
            "actor_type",
            "status",
            "reliability_level",
            "compliance_level",
            "approved_for_category_c",
            "validated_at",
            "rejection_reason",
            "revocation_reason",
            "created",
            "modified",
        ]

    class JSONAPIMeta:
        resource_name = "Actor"


class ActorCreateSerializer(BaseSerializer):
    actor_type = ResourceRelatedField(queryset=ActorType.objects.all())

    class Meta:
        model = Actor
        fields = [
            "id",
            "actor_type",
            "operation_radius_km",
            "max_quantity",
            "max_quantity_unit",
            "processing_delay",
            "variants",
            "is_available",
        ]
        read_only_fields = ["id"]

    class JSONAPIMeta:
        resource_name = "Actor"


class ActorUpdateSerializer(BaseSerializer):
    class Meta:
        model = Actor
        fields = [
            "id",
            "operation_radius_km",
            "max_quantity",
            "max_quantity_unit",
            "processing_delay",
            "variants",
            "is_available",
        ]
        read_only_fields = ["id"]

    class JSONAPIMeta:
        resource_name = "Actor"


class ActorRejectSerializer(serializers.Serializer):
    rejection_reason = serializers.CharField(min_length=1)


class ActorRevokeSerializer(serializers.Serializer):
    revocation_reason = serializers.CharField(min_length=1)


class ActorReliabilitySerializer(serializers.Serializer):
    reliability_level = serializers.ChoiceField(choices=Actor.ReliabilityLevel.choices)


class ActorComplianceSerializer(serializers.Serializer):
    compliance_level = serializers.ChoiceField(choices=Actor.ComplianceLevel.choices)


class ActorCategoryCSerializer(serializers.Serializer):
    approved = serializers.BooleanField()


# ---------------------------------------------------------------------------
# ActorDocument
# ---------------------------------------------------------------------------


class ActorDocumentSerializer(BaseSerializer):
    actor = ResourceRelatedField(read_only=True)

    class Meta:
        model = ActorDocument
        fields = [
            "id",
            "actor",
            "label",
            "file",
            "is_required",
            "uploaded_at",
            "admin_note",
        ]
        read_only_fields = ["id", "actor", "is_required", "uploaded_at", "admin_note"]

    class JSONAPIMeta:
        resource_name = "ActorDocument"


class ActorDocumentUploadSerializer(serializers.Serializer):
    """Used by the submit-documents action. Handles a single file upload."""

    label = serializers.CharField(max_length=255)
    file = serializers.FileField()
