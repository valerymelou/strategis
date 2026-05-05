from rest_framework_json_api import serializers
from rest_framework_json_api.settings import json_api_settings


class BaseSerializer(serializers.ModelSerializer):
    """
    Base serializer for all model serializers.
    """

    def to_internal_value(self, data):
        # Replace camel case keys with snake case keys
        if json_api_settings.FORMAT_FIELD_NAMES == "camelize":
            data = {self.camel_to_snake(key): data[key] for key in data}

        return super().to_internal_value(data)

    def camel_to_snake(self, name):
        """
        Convert camel case to snake case.
        """
        return "".join(["_" + c.lower() if c.isupper() else c for c in name]).lstrip(
            "_",
        )
