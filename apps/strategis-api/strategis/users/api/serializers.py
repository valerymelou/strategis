from rest_framework_json_api.relations import ResourceRelatedField

from strategis.core.api.serializers import BaseSerializer
from strategis.profiles.models import ProfessionalProfile
from strategis.users.models import User


class UserSerializer(BaseSerializer):
    profile = ResourceRelatedField(
        source="professional_profile",
        read_only=True,
        default=None,
    )

    included_serializers = {
        "profile": "strategis.profiles.api.serializers.ProfessionalProfileSerializer",
    }

    class Meta:
        model = User
        fields = ["id", "email", "first_name", "last_name", "is_email_verified", "profile"]
        read_only_fields = [
            "id",
            "email",
            "first_name",
            "last_name",
            "is_email_verified",
            "profile",
        ]

    class JSONAPIMeta:
        resource_name = "User"
