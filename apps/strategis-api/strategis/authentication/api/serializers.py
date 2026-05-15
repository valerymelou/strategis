import re

from django.utils.translation import gettext_lazy as _
from rest_framework import serializers


def _validate_password_strength(value: str) -> str:
    """Enforce uppercase, lowercase, digit and special-character requirements."""
    errors = []
    min_length = 8
    if len(value) < min_length:
        errors.append(_("Password must be at least 8 characters."))
    if not re.search(r"[A-Z]", value):
        errors.append(_("Password must contain at least one uppercase letter."))
    if not re.search(r"[a-z]", value):
        errors.append(_("Password must contain at least one lowercase letter."))
    if not re.search(r"[0-9]", value):
        errors.append(_("Password must contain at least one number."))
    if not re.search(r"[^A-Za-z0-9]", value):
        errors.append(_("Password must contain at least one special character."))
    if errors:
        raise serializers.ValidationError(errors)
    return value


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)


class RegisterSerializer(serializers.Serializer):
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)

    def validate_password(self, value: str) -> str:
        return _validate_password_strength(value)


class EmailVerificationSerializer(serializers.Serializer):
    code = serializers.CharField(min_length=6, max_length=6)


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    token = serializers.CharField()
    password = serializers.CharField(write_only=True, min_length=8)

    def validate_password(self, value: str) -> str:
        return _validate_password_strength(value)
