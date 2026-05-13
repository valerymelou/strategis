import pytest
from django.conf import settings
from django.core import mail
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from strategis.users.tests.factories import UserFactory

REGISTER_URL = "v1:register"

VALID_PAYLOAD = {
    "data": {
        "type": "Register",
        "attributes": {
            "first_name": "Jane",
            "last_name": "Doe",
            "email": "jane@example.com",
            "password": "secret1234",
        },
    },
}


@pytest.fixture
def api_client():
    return APIClient()


@pytest.mark.django_db
class TestRegisterView:
    def test_register_success_returns_201(self, api_client):
        url = reverse(REGISTER_URL)
        response = api_client.post(url, VALID_PAYLOAD, format="vnd.api+json")

        assert response.status_code == status.HTTP_201_CREATED

    def test_register_returns_user_data(self, api_client):
        url = reverse(REGISTER_URL)
        response = api_client.post(url, VALID_PAYLOAD, format="vnd.api+json")

        data = response.json()["data"]
        assert data["attributes"]["email"] == "jane@example.com"
        assert data["attributes"]["firstName"] == "Jane"
        assert data["attributes"]["lastName"] == "Doe"
        assert data["attributes"]["isEmailVerified"] is False

    def test_register_sets_access_cookie(self, api_client):
        url = reverse(REGISTER_URL)
        response = api_client.post(url, VALID_PAYLOAD, format="vnd.api+json")

        assert settings.AUTH_ACCESS_COOKIE in response.cookies
        assert response.cookies[settings.AUTH_ACCESS_COOKIE]["httponly"]

    def test_register_sets_refresh_cookie(self, api_client):
        url = reverse(REGISTER_URL)
        response = api_client.post(url, VALID_PAYLOAD, format="vnd.api+json")

        assert settings.AUTH_REFRESH_COOKIE in response.cookies
        assert response.cookies[settings.AUTH_REFRESH_COOKIE]["httponly"]

    def test_register_sends_verification_email(self, api_client):
        url = reverse(REGISTER_URL)
        api_client.post(url, VALID_PAYLOAD, format="vnd.api+json")

        assert len(mail.outbox) == 1
        assert mail.outbox[0].to == ["jane@example.com"]

    def test_register_duplicate_email_returns_400(self, api_client, db):
        UserFactory.create(email="jane@example.com")
        url = reverse(REGISTER_URL)
        response = api_client.post(url, VALID_PAYLOAD, format="vnd.api+json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_register_missing_email_returns_400(self, api_client):
        url = reverse(REGISTER_URL)
        payload = {
            "data": {
                "type": "Register",
                "attributes": {"first_name": "Jane", "last_name": "Doe", "password": "secret1234"},
            },
        }
        response = api_client.post(url, payload, format="vnd.api+json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_register_short_password_returns_400(self, api_client):
        url = reverse(REGISTER_URL)
        payload = {
            "data": {
                "type": "Register",
                "attributes": {
                    "first_name": "Jane",
                    "last_name": "Doe",
                    "email": "jane@example.com",
                    "password": "short",
                },
            },
        }
        response = api_client.post(url, payload, format="vnd.api+json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
