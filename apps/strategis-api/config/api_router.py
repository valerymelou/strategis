from django.conf import settings
from django.urls import path
from rest_framework.routers import DefaultRouter
from rest_framework.routers import SimpleRouter

from strategis.authentication.api.views import LoginView
from strategis.authentication.api.views import LogoutView
from strategis.authentication.api.views import TokenRefreshView
from strategis.users.api.views import UserViewSet

router = DefaultRouter() if settings.DEBUG else SimpleRouter()

router.register("users", UserViewSet, basename="user")

app_name = "v1"
urlpatterns = [
    *router.urls,
    path("auth/login/", LoginView.as_view(), name="login"),
    path("auth/logout/", LogoutView.as_view(), name="logout"),
    path("auth/refresh/", TokenRefreshView.as_view(), name="token-refresh"),
]
