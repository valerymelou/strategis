from django.conf import settings
from django.contrib.auth.backends import ModelBackend
from rest_framework import status
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.exceptions import NotAuthenticated
from rest_framework.permissions import AllowAny
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from rest_framework_simplejwt.tokens import RefreshToken

from strategis.users.api.serializers import UserSerializer

from .serializers import LoginSerializer


class LoginRateThrottle(AnonRateThrottle):
    """Brute-force protection for the login endpoint (scope: email_login)."""

    scope = "email_login"


class TokenRefreshRateThrottle(AnonRateThrottle):
    """Rate-limit token refresh attempts (scope: token_refresh)."""

    scope = "token_refresh"


def _set_auth_cookies(response, access_token, refresh_token=None):
    """Attach HttpOnly JWT cookies to the response."""
    secure = not settings.DEBUG
    response.set_cookie(
        settings.AUTH_ACCESS_COOKIE,
        access_token,
        max_age=settings.AUTH_ACCESS_COOKIE_MAX_AGE,
        httponly=True,
        secure=secure,
        samesite="Lax",
        path="/",
    )
    if refresh_token is not None:
        response.set_cookie(
            settings.AUTH_REFRESH_COOKIE,
            refresh_token,
            max_age=settings.AUTH_REFRESH_COOKIE_MAX_AGE,
            httponly=True,
            secure=secure,
            samesite="Lax",
            path="/",
        )


def _delete_auth_cookies(response):
    """Remove JWT cookies from the response."""
    response.delete_cookie(settings.AUTH_ACCESS_COOKIE, path="/")
    response.delete_cookie(settings.AUTH_REFRESH_COOKIE, path="/")


class LoginView(APIView):
    """
    POST /v1/auth/login/

    Accepts JSON:API-formatted credentials, authenticates the user and sets
    HttpOnly JWT cookies.  Returns the authenticated user resource on success.

    Request body::

        {
          "data": {
            "type": "Login",
            "attributes": { "email": "...", "password": "..." }
          }
        }
    """

    # The JSON:API parser validates the incoming `type` field against this name.
    resource_name = "Login"
    permission_classes = [AllowAny]
    throttle_classes = [LoginRateThrottle]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data["email"]
        password = serializer.validated_data["password"]

        # Use ModelBackend directly to avoid iterating backends that may not
        # be installed (e.g. allauth) in all environments.
        user = ModelBackend().authenticate(request, username=email, password=password)
        if user is None or not user.is_active:
            msg = "Invalid email or password."
            raise AuthenticationFailed(msg)

        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)
        refresh_token = str(refresh)

        user_data = UserSerializer(user, context={"request": request}).data
        response = Response(user_data, status=status.HTTP_200_OK)
        _set_auth_cookies(response, access_token, refresh_token)
        return response


class LogoutView(APIView):
    """
    POST /v1/auth/logout/

    Blacklists the current refresh token and clears both JWT cookies.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.COOKIES.get(settings.AUTH_REFRESH_COOKIE)
        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
            except TokenError:
                # Token already invalid/blacklisted — still clear cookies
                pass

        response = Response(status=status.HTTP_204_NO_CONTENT)
        _delete_auth_cookies(response)
        return response


class TokenRefreshView(APIView):
    """
    POST /v1/auth/refresh/

    Reads the refresh token from the HttpOnly cookie, issues a new access
    token (and a rotated refresh token when ROTATE_REFRESH_TOKENS is True),
    and sets the updated cookies.
    """

    permission_classes = [AllowAny]
    throttle_classes = [TokenRefreshRateThrottle]

    def post(self, request):
        refresh_token = request.COOKIES.get(settings.AUTH_REFRESH_COOKIE)
        if not refresh_token:
            msg = "No refresh token cookie present."
            raise NotAuthenticated(msg)

        serializer = TokenRefreshSerializer(data={"refresh": refresh_token})
        try:
            serializer.is_valid(raise_exception=True)
        except TokenError as exc:
            raise AuthenticationFailed(str(exc)) from exc

        new_access = serializer.validated_data["access"]
        # When ROTATE_REFRESH_TOKENS=True simplejwt returns a new refresh token
        new_refresh = serializer.validated_data.get("refresh")

        response = Response({"detail": "Token refreshed."}, status=status.HTTP_200_OK)
        _set_auth_cookies(response, new_access, new_refresh)
        return response
