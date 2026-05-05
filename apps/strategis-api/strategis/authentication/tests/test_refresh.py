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


@pytest.mark.django_db
class TestTokenRefreshView:
    def test_refresh_with_valid_cookie_returns_200(self, api_client, user):
        refresh = RefreshToken.for_user(user)
        api_client.cookies[settings.AUTH_REFRESH_COOKIE] = str(refresh)

        response = api_client.post(reverse("v1:token-refresh"), format="vnd.api+json")

        assert response.status_code == status.HTTP_200_OK

    def test_refresh_sets_new_access_cookie(self, api_client, user):
        refresh = RefreshToken.for_user(user)
        api_client.cookies[settings.AUTH_REFRESH_COOKIE] = str(refresh)

        response = api_client.post(reverse("v1:token-refresh"), format="vnd.api+json")

        assert settings.AUTH_ACCESS_COOKIE in response.cookies
        cookie = response.cookies[settings.AUTH_ACCESS_COOKIE]
        assert cookie["httponly"]

    def test_refresh_rotates_refresh_cookie(self, api_client, user):
        """When ROTATE_REFRESH_TOKENS=True a new refresh cookie must be issued."""
        refresh = RefreshToken.for_user(user)
        original_refresh = str(refresh)
        api_client.cookies[settings.AUTH_REFRESH_COOKIE] = original_refresh

        response = api_client.post(reverse("v1:token-refresh"), format="vnd.api+json")

        if settings.SIMPLE_JWT.get("ROTATE_REFRESH_TOKENS", False):
            assert settings.AUTH_REFRESH_COOKIE in response.cookies
            new_refresh_value = response.cookies[settings.AUTH_REFRESH_COOKIE].value
            assert new_refresh_value != original_refresh

    def test_refresh_without_cookie_returns_401(self, api_client, db):
        response = api_client.post(reverse("v1:token-refresh"), format="vnd.api+json")

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_refresh_with_invalid_token_returns_401(self, api_client, db):
        api_client.cookies[settings.AUTH_REFRESH_COOKIE] = "not.a.valid.token"

        response = api_client.post(reverse("v1:token-refresh"), format="vnd.api+json")

        assert response.status_code == status.HTTP_401_UNAUTHORIZED
