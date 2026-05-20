from django.conf import settings
from django.urls import path
from rest_framework.routers import DefaultRouter
from rest_framework.routers import SimpleRouter

from strategis.authentication.api.views import LoginView
from strategis.authentication.api.views import LogoutView
from strategis.authentication.api.views import PasswordResetConfirmView
from strategis.authentication.api.views import PasswordResetRequestView
from strategis.authentication.api.views import RegisterView
from strategis.authentication.api.views import ResendVerificationView
from strategis.authentication.api.views import TokenRefreshView
from strategis.authentication.api.views import VerifyEmailView
from strategis.profiles.api.urls import urlpatterns as profiles_urlpatterns
from strategis.users.api.views import UserViewSet
from strategis.waste.api.urls import urlpatterns as waste_urlpatterns

router = DefaultRouter() if settings.DEBUG else SimpleRouter()

router.register("users", UserViewSet, basename="user")

app_name = "v1"
urlpatterns = [
    *router.urls,
    *profiles_urlpatterns,
    *waste_urlpatterns,
    path("auth/login/", LoginView.as_view(), name="login"),
    path("auth/logout/", LogoutView.as_view(), name="logout"),
    path("auth/refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    path("auth/register/", RegisterView.as_view(), name="register"),
    path("auth/verify-email/", VerifyEmailView.as_view(), name="verify-email"),
    path(
        "auth/resend-verification/",
        ResendVerificationView.as_view(),
        name="resend-verification",
    ),
    path(
        "auth/password-reset/",
        PasswordResetRequestView.as_view(),
        name="password-reset",
    ),
    path(
        "auth/password-reset/confirm/",
        PasswordResetConfirmView.as_view(),
        name="password-reset-confirm",
    ),
]
