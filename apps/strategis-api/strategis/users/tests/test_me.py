import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from strategis.users.tests.factories import UserFactory


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


@pytest.mark.django_db
class TestMeEndpoint:
    def test_me_returns_current_user(self, authenticated_client, user):
        response = authenticated_client.get(reverse("v1:user-me"))

        assert response.status_code == status.HTTP_200_OK
        data = response.json()["data"]
        assert data["id"] == str(user.id)
        assert data["attributes"]["email"] == user.email
        assert data["attributes"]["first_name"] == user.first_name
        assert data["attributes"]["last_name"] == user.last_name

    def test_me_returns_correct_type(self, authenticated_client):
        response = authenticated_client.get(reverse("v1:user-me"))

        assert response.status_code == status.HTTP_200_OK
        assert response.json()["data"]["type"] == "User"

    def test_me_requires_authentication(self, api_client):
        response = api_client.get(reverse("v1:user-me"))

        assert response.status_code == status.HTTP_401_UNAUTHORIZED
