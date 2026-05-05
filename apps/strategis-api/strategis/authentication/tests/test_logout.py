import pytest
from django.conf import settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from strategis.users.tests.factories import UserFactory


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def user(db):
    return UserFactory.create()


@pytest.fixture
def client_with_cookies(api_client, user):
    """APIClient authenticated via cookies, mirrors a real browser session."""
    refresh = RefreshToken.for_user(user)
    api_client.cookies[settings.AUTH_ACCESS_COOKIE] = str(refresh.access_token)
    api_client.cookies[settings.AUTH_REFRESH_COOKIE] = str(refresh)
    api_client.force_authenticate(user=user)
    return api_client, str(refresh)


@pytest.mark.django_db
class TestLogoutView:
    def test_logout_returns_204(self, client_with_cookies):
        client, _ = client_with_cookies
        response = client.post(reverse("v1:logout"), format="vnd.api+json")

        assert response.status_code == status.HTTP_204_NO_CONTENT

    def test_logout_clears_access_cookie(self, client_with_cookies):
        client, _ = client_with_cookies
        response = client.post(reverse("v1:logout"), format="vnd.api+json")

        assert settings.AUTH_ACCESS_COOKIE in response.cookies
        assert response.cookies[settings.AUTH_ACCESS_COOKIE]["max-age"] == 0

    def test_logout_clears_refresh_cookie(self, client_with_cookies):
        client, _ = client_with_cookies
        response = client.post(reverse("v1:logout"), format="vnd.api+json")

        assert settings.AUTH_REFRESH_COOKIE in response.cookies
        assert response.cookies[settings.AUTH_REFRESH_COOKIE]["max-age"] == 0

    def test_logout_blacklists_refresh_token(self, client_with_cookies):
        from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken

        client, refresh_str = client_with_cookies
        # Extract jti BEFORE logout so we can verify it's blacklisted afterward
        jti = RefreshToken(refresh_str).payload["jti"]
        client.post(reverse("v1:logout"), format="vnd.api+json")

        assert BlacklistedToken.objects.filter(token__jti=jti).exists()

    def test_logout_requires_authentication(self, api_client):
        response = api_client.post(reverse("v1:logout"), format="vnd.api+json")

        assert response.status_code == status.HTTP_401_UNAUTHORIZED
