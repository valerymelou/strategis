from __future__ import annotations

from strategis.core.tests import BaseTestCase
from strategis.profiles.models import Actor, PremiumUpgradeRequest

from .factories import (
    ActorDocumentFactory,
    ActorFactory,
    ActorTypeFactory,
    PremiumUpgradeRequestFactory,
    ProfessionalProfileFactory,
)


class TestProfessionalProfile(BaseTestCase):
    def test_str_representation(self):
        profile = ProfessionalProfileFactory(company_name="Acme Corp")

        assert str(profile) == "Acme Corp"


class TestPremiumUpgradeRequest(BaseTestCase):
    def test_str_representation(self):
        profile = ProfessionalProfileFactory(company_name="Acme Corp")
        upgrade_request = PremiumUpgradeRequestFactory(
            profile=profile,
            status=PremiumUpgradeRequest.Status.PENDING,
        )

        assert str(upgrade_request) == "Acme Corp (Pending)"


class TestActorType(BaseTestCase):
    def test_str_representation(self):
        actor_type = ActorTypeFactory(name="Producer")

        assert str(actor_type) == "Producer"


class TestActor(BaseTestCase):
    def test_str_representation(self):
        profile = ProfessionalProfileFactory(company_name="Acme Corp")
        actor_type = ActorTypeFactory(name="Producer")
        actor = ActorFactory(profile=profile, actor_type=actor_type)

        assert str(actor) == "Acme Corp - Producer"


class TestActorDocument(BaseTestCase):
    def test_str_representation(self):
        document = ActorDocumentFactory(label="Business License")

        assert str(document) == "Business License"
