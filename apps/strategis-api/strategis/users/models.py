from typing import ClassVar

from django.contrib.auth.models import AbstractUser
from django.db.models import EmailField
from django.utils.translation import gettext_lazy as _

from strategis.core.models import BaseModel

from .managers import UserManager


class User(BaseModel, AbstractUser):
    """
    Default custom user model for Strategis.
    If adding fields that need to be filled at user signup,
    check forms.SignupForm and forms.SocialSignupForms accordingly.
    """

    email = EmailField(_("email address"), unique=True)
    username = None  # type: ignore[assignment]

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    objects: ClassVar[UserManager] = UserManager()

    def __str__(self):
        return f"{self.first_name} {self.last_name}".strip() or self.email
