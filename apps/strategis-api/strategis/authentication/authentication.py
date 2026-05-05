from typing import TYPE_CHECKING

from django.conf import settings
from rest_framework_simplejwt.authentication import JWTAuthentication

if TYPE_CHECKING:
    from rest_framework.request import Request


class CookieJWTAuthentication(JWTAuthentication):
    """Read the access token from an HttpOnly cookie instead of the Authorization
    header.

    Cookie name is configured via settings.AUTH_ACCESS_COOKIE
    (default: 'strategis-access-token').

    In DEBUG mode only, falls back to the standard Bearer header so the DRF
    browsable API and local tooling still work.  In production the header
    fallback is disabled: a request without the HttpOnly cookie is treated as
    anonymous, preventing stolen tokens (e.g. from server logs) from being
    replayed directly against the API.

    When a cookie is present but the token is expired/invalid we intentionally
    let get_validated_token raise AuthenticationFailed (401) rather than
    swallowing the error and falling through as anonymous.  This ensures the
    frontend interceptor can catch the 401, refresh the token, and retry — even
    on AllowAny endpoints that would otherwise silently accept the anonymous
    request and skip any authenticated-user logic.
    """

    def authenticate(self, request: Request):
        cookie_name: str = getattr(
            settings,
            "AUTH_ACCESS_COOKIE",
            "strategis-access-token",
        )
        raw_token: str | None = request.COOKIES.get(cookie_name)

        if raw_token is None:
            # In development allow the Authorization: Bearer header so the DRF
            # browsable API and tools like Postman/Swagger still work.
            # In production, no cookie → anonymous (no header fallback).
            if settings.DEBUG:
                return super().authenticate(request)
            return None

        # Cookie present: validate and let InvalidToken propagate as 401 so the
        # client can refresh and retry.
        validated_token = self.get_validated_token(raw_token)
        return self.get_user(validated_token), validated_token
