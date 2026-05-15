from __future__ import annotations

import uuid

from strategis.core.tests import BaseTestCase

from .factories import AuditLogFactory


class TestAuditLog(BaseTestCase):
    def test_str_representation(self):
        object_id = uuid.uuid4()
        log = AuditLogFactory(
            action="lot.validated",
            object_type="WasteLot",
            object_id=object_id,
        )

        assert str(log) == f"lot.validated on WasteLot({object_id})"

    def test_system_action_has_no_user(self):
        log = AuditLogFactory(user=None)

        assert log.user is None
        assert log.pk is not None

    def test_detail_defaults_to_empty_dict(self):
        log = AuditLogFactory(detail={})

        assert log.detail == {}

    def test_detail_stores_context(self):
        detail = {
            "before": {"status": "pending"},
            "after": {"status": "validated"},
            "reason": "OK",
        }
        log = AuditLogFactory(detail=detail)

        assert log.detail == detail

    def test_ordering_is_newest_first(self):
        first = AuditLogFactory()
        second = AuditLogFactory()

        logs = list(type(first).objects.all())

        assert logs[0].pk == second.pk
        assert logs[1].pk == first.pk

    def test_user_deletion_nullifies_log(self):
        log = AuditLogFactory()
        user = log.user
        user.delete()
        log.refresh_from_db()

        assert log.user is None
