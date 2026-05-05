from strategis.core.api.serializers import BaseSerializer
from strategis.users.models import User


class UserSerializer(BaseSerializer):
    class Meta:
        model = User
        fields = ["id", "email", "name"]
        read_only_fields = ["id", "email", "name"]

    class JSONAPIMeta:
        resource_name = "User"
