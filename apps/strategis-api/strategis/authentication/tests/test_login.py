import pytest
from django.conf import settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from strategis.users.tests.factories import UserFactory

KNOWN_PASSWORD = "testpassword123"  # noqa: S105


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def user(db):
    return UserFactory.create(password=KNOWN_PASSWORD)


@pytest.mark.django_db
class TestLoginView:
    def test_login_success_returns_200(self, api_client, user):
        url = reverse("v1:login")
        payload = {
            "data": {
                "type": "Login",
                "attributes": {"email": user.email, "password": KNOWN_PASSWORD},
            },
        }
        response = api_client.post(url, payload, format="vnd.api+json")

        assert response.status_code == status.HTTP_200_OK

    def test_login_success_sets_access_cookie(self, api_client, user):
        url = reverse("v1:login")
        payload = {
            "data": {
                "type": "Login",
                "attributes": {"email": user.email, "password": KNOWN_PASSWORD},
            },
        }
        response = api_client.post(url, payload, format="vnd.api+json")

        assert settings.AUTH_ACCESS_COOKIE in response.cookies
        cookie = response.cookies[settings.AUTH_ACCESS_COOKIE]
        assert cookie["httponly"]
        assert cookie["path"] == "/"

    def test_login_success_sets_refresh_cookie(self, api_client, user):
        url = reverse("v1:login")
        payload = {
            "data": {
                "type": "Login",
                "attributes": {"email": user.email, "password": KNOWN_PASSWORD},
            },
        }
        response = api_client.post(url, payload, format="vnd.api+json")

        assert settings.AUTH_REFRESH_COOKIE in response.cookies
        cookie = response.cookies[settings.AUTH_REFRESH_COOKIE]
        assert cookie["httponly"]

    def test_login_success_returns_user_data(self, api_client, user):
        url = reverse("v1:login")
        payload = {
            "data": {
                "type": "Login",
                "attributes": {"email": user.email, "password": KNOWN_PASSWORD},
            },
        }
        response = api_client.post(url, payload, format="vnd.api+json")

        data = response.json()["data"]
        assert data["id"] == str(user.id)
        assert data["attributes"]["email"] == user.email

    def test_login_wrong_password_returns_401(self, api_client, user):
        url = reverse("v1:login")
        payload = {
            "data": {
                "type": "Login",
                "attributes": {"email": user.email, "password": "wrongpassword"},
            },
        }
        response = api_client.post(url, payload, format="vnd.api+json")

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_login_unknown_email_returns_401(self, api_client, db):
        url = reverse("v1:login")
        payload = {
            "data": {
                "type": "Login",
                "attributes": {"email": "nobody@example.com", "password": "password"},
            },
        }
        response = api_client.post(url, payload, format="vnd.api+json")

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_login_missing_email_returns_400(self, api_client, db):
        url = reverse("v1:login")
        payload = {
            "data": {
                "type": "Login",
                "attributes": {"password": KNOWN_PASSWORD},
            },
        }
        response = api_client.post(url, payload, format="vnd.api+json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_login_missing_password_returns_400(self, api_client, db):
        url = reverse("v1:login")
        payload = {
            "data": {
                "type": "Login",
                "attributes": {"email": "test@example.com"},
            },
        }
        response = api_client.post(url, payload, format="vnd.api+json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
