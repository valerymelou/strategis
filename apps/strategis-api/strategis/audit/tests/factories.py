from __future__ import annotations

import uuid

import factory
from factory import Faker
from factory import SubFactory
from factory.django import DjangoModelFactory

from strategis.audit.models import AuditLog
from strategis.users.tests.factories import UserFactory


class AuditLogFactory(DjangoModelFactory[AuditLog]):
    user = SubFactory(UserFactory)
    action = Faker("bothify", text="???.???")
    object_type = Faker("word")
    object_id = factory.LazyFunction(uuid.uuid4)
    detail = factory.LazyFunction(dict)
    ip_address = Faker("ipv4")

    class Meta:
        model = AuditLog
