from __future__ import annotations

from rest_framework_json_api import serializers

from strategis.core.api.serializers import BaseSerializer
from strategis.waste.models import CEDCode


class CEDCodeSerializer(BaseSerializer):
    """Single serializer for read and write. `created`/`modified` are read-only
    so DRF ignores them on writes automatically."""

    class Meta:
        model = CEDCode
        fields = [
            "id",
            "code",
            "chapter_code",
            "sub_category_code",
            "sub_category_label",
            "label",
            "is_hazardous",
            "category",
            "sub_category_a",
            "sub_category_a_label",
            "allowed_units",
            "points_per_unit",
            "reference_scenario",
            "is_active",
            "created",
            "modified",
        ]
        read_only_fields = ["id", "created", "modified"]

    class JSONAPIMeta:
        resource_name = "CEDCode"

    def validate_code(self, value: str) -> str:
        value = value.strip()
        qs = CEDCode.objects.filter(code=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            msg = "A CED code with this code already exists."
            raise serializers.ValidationError(msg)
        return value
