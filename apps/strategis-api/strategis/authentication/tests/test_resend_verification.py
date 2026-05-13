import pytest
from django.core import mail
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from strategis.users.tests.factories import UserFactory

RESEND_URL = "v1:resend-verification"


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def unverified_user(db):
    return UserFactory.create(is_email_verified=False)


@pytest.fixture
def verified_user(db):
    return UserFactory.create(is_email_verified=True)


@pytest.mark.django_db
class TestResendVerificationView:
    def test_resend_success_returns_204(self, api_client, unverified_user):
        api_client.force_authenticate(user=unverified_user)
        url = reverse(RESEND_URL)
        response = api_client.post(url, {}, format="vnd.api+json")

        assert response.status_code == status.HTTP_204_NO_CONTENT

    def test_resend_sends_email(self, api_client, unverified_user):
        api_client.force_authenticate(user=unverified_user)
        url = reverse(RESEND_URL)
        api_client.post(url, {}, format="vnd.api+json")

        assert len(mail.outbox) == 1
        assert mail.outbox[0].to == [unverified_user.email]

    def test_resend_already_verified_returns_400(self, api_client, verified_user):
        api_client.force_authenticate(user=verified_user)
        url = reverse(RESEND_URL)
        response = api_client.post(url, {}, format="vnd.api+json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_resend_unauthenticated_returns_401(self, api_client):
        url = reverse(RESEND_URL)
        response = api_client.post(url, {}, format="vnd.api+json")

        assert response.status_code == status.HTTP_401_UNAUTHORIZED
