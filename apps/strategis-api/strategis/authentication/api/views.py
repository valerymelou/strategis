from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.backends import ModelBackend
from django.core.mail import send_mail
from django.utils.translation import gettext_lazy as _
from rest_framework import status
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.exceptions import NotAuthenticated
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import AllowAny
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from rest_framework_simplejwt.tokens import RefreshToken

from strategis.authentication.models import EmailVerificationCode
from strategis.users.api.serializers import UserSerializer

from .serializers import EmailVerificationSerializer
from .serializers import LoginSerializer
from .serializers import RegisterSerializer

User = get_user_model()


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


class RegisterRateThrottle(AnonRateThrottle):
    """Rate limit registration attempts (scope: register)."""

    scope = "register"


def _send_verification_email(user, code: str) -> None:
    """Send the 6-digit verification code to the user's email."""
    send_mail(
        subject=_("Verify your email address"),
        message=_(
            "Your verification code is: %(code)s\n\nThis code expires in 10 minutes.",
        )
        % {"code": code},
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        fail_silently=False,
    )


class RegisterView(APIView):
    """
    POST /v1/auth/register/

    Creates a new user account, issues JWT cookies, and sends a verification
    email with a 6-digit OTP.

    Request body::

        {
          "data": {
            "type": "Register",
            "attributes": {
              "first_name": "Jane",
              "last_name": "Doe",
              "email": "jane@example.com",
              "password": "secret1234"
            }
          }
        }
    """

    resource_name = "Register"
    permission_classes = [AllowAny]
    throttle_classes = [RegisterRateThrottle]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data
        email = data["email"]

        if User.objects.filter(email=email).exists():
            raise ValidationError({"email": _("A user with this email already exists.")})

        user = User.objects.create_user(
            email=email,
            password=data["password"],
            first_name=data["first_name"],
            last_name=data["last_name"],
        )

        verification = EmailVerificationCode.create_for_user(user)
        _send_verification_email(user, verification.code)

        refresh = RefreshToken.for_user(user)
        user_data = UserSerializer(user, context={"request": request}).data
        response = Response(user_data, status=status.HTTP_201_CREATED)
        _set_auth_cookies(response, str(refresh.access_token), str(refresh))
        return response


class VerifyEmailView(APIView):
    """
    POST /v1/auth/verify-email/

    Validates the 6-digit OTP and marks the user's email as verified.

    Request body::

        {
          "data": {
            "type": "EmailVerification",
            "attributes": { "code": "123456" }
          }
        }
    """

    resource_name = "EmailVerification"
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = EmailVerificationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        code = serializer.validated_data["code"]
        user = request.user

        verification = (
            EmailVerificationCode.objects.filter(
                user=user,
                code=code,
                is_used=False,
            )
            .order_by("-created")
            .first()
        )

        if verification is None or not verification.is_valid:
            raise ValidationError({"code": _("Invalid or expired verification code.")})

        verification.is_used = True
        verification.save(update_fields=["is_used"])

        user.is_email_verified = True
        user.save(update_fields=["is_email_verified"])

        return Response(status=status.HTTP_204_NO_CONTENT)


class ResendVerificationView(APIView):
    """
    POST /v1/auth/resend-verification/

    Invalidates any existing OTP codes and sends a fresh one to the
    authenticated user's email.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user

        if user.is_email_verified:
            raise ValidationError({"detail": _("Email is already verified.")})

        verification = EmailVerificationCode.create_for_user(user)
        _send_verification_email(user, verification.code)

        return Response(status=status.HTTP_204_NO_CONTENT)
