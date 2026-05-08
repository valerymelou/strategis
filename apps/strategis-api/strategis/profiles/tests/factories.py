from __future__ import annotations

import factory
from factory import Faker, SubFactory
from factory.django import DjangoModelFactory

from strategis.profiles.models import (
    Actor,
    ActorDocument,
    ActorType,
    PremiumUpgradeRequest,
    ProfessionalProfile,
)
from strategis.users.tests.factories import UserFactory


class ActorTypeFactory(DjangoModelFactory[ActorType]):
    name = Faker("word")
    slug = factory.Sequence(lambda n: f"actor-type-{n}")
    description = Faker("sentence")
    requires_validation = True
    is_active = True
    required_documents = factory.LazyFunction(list)

    class Meta:
        model = ActorType
        django_get_or_create = ["slug"]


class ProfessionalProfileFactory(DjangoModelFactory[ProfessionalProfile]):
    user = SubFactory(UserFactory)
    company_name = Faker("company")
    entity_type = ProfessionalProfile.EntityType.COMPANY
    tax_id_number = Faker("bothify", text="TAX-####-????")
    phone = Faker("phone_number")
    is_active = True

    class Meta:
        model = ProfessionalProfile


class PremiumUpgradeRequestFactory(DjangoModelFactory[PremiumUpgradeRequest]):
    profile = SubFactory(ProfessionalProfileFactory)
    status = PremiumUpgradeRequest.Status.PENDING

    class Meta:
        model = PremiumUpgradeRequest


class ActorFactory(DjangoModelFactory[Actor]):
    profile = SubFactory(ProfessionalProfileFactory)
    actor_type = SubFactory(ActorTypeFactory)
    status = Actor.Status.PENDING
    is_available = True

    class Meta:
        model = Actor


class ActorDocumentFactory(DjangoModelFactory[ActorDocument]):
    actor = SubFactory(ActorFactory)
    label = Faker("sentence", nb_words=4)
    file = factory.django.FileField(filename="document.pdf")
    is_required = True

    class Meta:
        model = ActorDocument
