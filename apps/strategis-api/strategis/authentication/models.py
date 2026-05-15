import secrets

from django.conf import settings
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

from strategis.core.models import BaseModel

OTP_LENGTH = 6
OTP_EXPIRY_MINUTES = 10
PASSWORD_RESET_EXPIRY_HOURS = 1


def generate_otp() -> str:
    """Generate a cryptographically secure 6-digit OTP."""
    return str(secrets.randbelow(10**OTP_LENGTH)).zfill(OTP_LENGTH)


class EmailVerificationCode(BaseModel):
    """
    A one-time 6-digit code sent to the user's email to verify their address.
    Each call to resend invalidates previous codes.
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="verification_codes",
        verbose_name=_("user"),
    )
    code = models.CharField(_("code"), max_length=6)
    expires_at = models.DateTimeField(_("expires at"))
    is_used = models.BooleanField(_("used"), default=False)

    class Meta:
        ordering = ["-created"]
        verbose_name = _("email verification code")
        verbose_name_plural = _("email verification codes")

    def __str__(self):
        return f"{self.user.email} — {self.code}"

    @property
    def is_valid(self) -> bool:
        return not self.is_used and timezone.now() < self.expires_at

    @classmethod
    def create_for_user(cls, user) -> EmailVerificationCode:
        """Invalidate any existing codes and create a fresh one."""
        cls.objects.filter(user=user, is_used=False).update(is_used=True)
        expires_at = timezone.now() + timezone.timedelta(minutes=OTP_EXPIRY_MINUTES)
        return cls.objects.create(
            user=user,
            code=generate_otp(),
            expires_at=expires_at,
        )


class PasswordResetToken(BaseModel):
    """
    A secure single-use token for password reset, valid for 1 hour.
    Creating a new token for a user invalidates all previous ones.
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="password_reset_tokens",
        verbose_name=_("user"),
    )
    token = models.CharField(_("token"), max_length=64, unique=True)
    expires_at = models.DateTimeField(_("expires at"))
    is_used = models.BooleanField(_("used"), default=False)

    class Meta:
        ordering = ["-created"]
        verbose_name = _("password reset token")
        verbose_name_plural = _("password reset tokens")

    def __str__(self):
        return f"{self.user.email} — {'used' if self.is_used else 'active'}"

    @property
    def is_valid(self) -> bool:
        return not self.is_used and timezone.now() < self.expires_at

    @classmethod
    def create_for_user(cls, user) -> PasswordResetToken:
        """Invalidate existing tokens for this user and create a fresh one."""
        cls.objects.filter(user=user, is_used=False).update(is_used=True)
        expires_at = timezone.now() + timezone.timedelta(
            hours=PASSWORD_RESET_EXPIRY_HOURS
        )
        return cls.objects.create(
            user=user,
            token=secrets.token_urlsafe(48),
            expires_at=expires_at,
        )
