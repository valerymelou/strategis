import pytest
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from strategis.authentication.models import EmailVerificationCode
from strategis.users.tests.factories import UserFactory

VERIFY_URL = "v1:verify-email"


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def user(db):
    return UserFactory.create()


@pytest.fixture
def authenticated_client(api_client, user):
    api_client.force_authenticate(user=user)
    return api_client


@pytest.fixture
def valid_code(user):
    return EmailVerificationCode.create_for_user(user)


@pytest.mark.django_db
class TestVerifyEmailView:
    def test_verify_success_returns_204(self, authenticated_client, valid_code):
        url = reverse(VERIFY_URL)
        payload = {
            "data": {
                "type": "EmailVerification",
                "attributes": {"code": valid_code.code},
            },
        }
        response = authenticated_client.post(url, payload, format="vnd.api+json")

        assert response.status_code == status.HTTP_204_NO_CONTENT

    def test_verify_marks_email_verified(self, authenticated_client, user, valid_code):
        url = reverse(VERIFY_URL)
        payload = {
            "data": {
                "type": "EmailVerification",
                "attributes": {"code": valid_code.code},
            },
        }
        authenticated_client.post(url, payload, format="vnd.api+json")

        user.refresh_from_db()
        assert user.is_email_verified is True

    def test_verify_marks_code_used(self, authenticated_client, valid_code):
        url = reverse(VERIFY_URL)
        payload = {
            "data": {
                "type": "EmailVerification",
                "attributes": {"code": valid_code.code},
            },
        }
        authenticated_client.post(url, payload, format="vnd.api+json")

        valid_code.refresh_from_db()
        assert valid_code.is_used is True

    def test_verify_wrong_code_returns_400(self, authenticated_client, valid_code):
        url = reverse(VERIFY_URL)
        payload = {
            "data": {
                "type": "EmailVerification",
                "attributes": {"code": "000000"},
            },
        }
        response = authenticated_client.post(url, payload, format="vnd.api+json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_verify_expired_code_returns_400(self, authenticated_client, user):
        code = EmailVerificationCode.objects.create(
            user=user,
            code="123456",
            expires_at=timezone.now() - timezone.timedelta(minutes=1),
        )
        url = reverse(VERIFY_URL)
        payload = {
            "data": {
                "type": "EmailVerification",
                "attributes": {"code": code.code},
            },
        }
        response = authenticated_client.post(url, payload, format="vnd.api+json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_verify_already_used_code_returns_400(
        self,
        authenticated_client,
        valid_code,
    ):
        valid_code.is_used = True
        valid_code.save()
        url = reverse(VERIFY_URL)
        payload = {
            "data": {
                "type": "EmailVerification",
                "attributes": {"code": valid_code.code},
            },
        }
        response = authenticated_client.post(url, payload, format="vnd.api+json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_verify_unauthenticated_returns_401(self, api_client, valid_code):
        url = reverse(VERIFY_URL)
        payload = {
            "data": {
                "type": "EmailVerification",
                "attributes": {"code": valid_code.code},
            },
        }
        response = api_client.post(url, payload, format="vnd.api+json")

        assert response.status_code == status.HTTP_401_UNAUTHORIZED
