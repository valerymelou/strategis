from __future__ import annotations

from strategis.core.tests import BaseTestCase

from .factories import UserFactory


class TestUser(BaseTestCase):
    def test_str_representation(self):
        user = UserFactory(name="John Doe")

        assert str(user) == "John Doe"
