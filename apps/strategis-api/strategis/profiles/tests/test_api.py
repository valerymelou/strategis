"""
API tests for the profiles app.

Test strategy:
  - Use BaseAPITestCase.client (APIClient) which sends JSON:API content-type.
  - Auth is handled via force_authenticate (no need to test JWT internals here).
  - One test class per viewset / logical group of endpoints.
"""

from __future__ import annotations

import io

from rest_framework import status

from strategis.core.tests import BaseAPITestCase
from strategis.profiles.models import Actor
from strategis.profiles.models import ActorDocument
from strategis.profiles.models import PremiumUpgradeRequest
from strategis.profiles.models import ProfessionalProfile
from strategis.profiles.tests.factories import ActorDocumentFactory
from strategis.profiles.tests.factories import ActorFactory
from strategis.profiles.tests.factories import ActorTypeFactory
from strategis.profiles.tests.factories import PremiumUpgradeRequestFactory
from strategis.profiles.tests.factories import ProfessionalProfileFactory
from strategis.users.tests.factories import UserFactory


def _json_api_payload(
    resource_type: str,
    attributes: dict,
    relationships: dict | None = None,
    pk=None,
) -> dict:
    """Build a minimal JSON:API request body."""
    data: dict = {"data": {"type": resource_type, "attributes": attributes}}
    if pk is not None:
        data["data"]["id"] = str(pk)
    if relationships:
        data["data"]["relationships"] = relationships
    return data


def _rel(resource_type: str, pk) -> dict:
    return {"data": {"type": resource_type, "id": str(pk)}}


# ---------------------------------------------------------------------------
# ActorType
# ---------------------------------------------------------------------------


class TestActorTypeList(BaseAPITestCase):
    def setUp(self):
        self.user = UserFactory()
        self.client.force_authenticate(self.user)
        self.url = self.reverse("actor-type-list")

    def test_returns_active_actor_types(self):
        active = ActorTypeFactory(is_active=True)
        inactive = ActorTypeFactory(is_active=False)

        resp = self.client.get(self.url)

        assert resp.status_code == status.HTTP_200_OK
        ids = [item["id"] for item in resp.data]
        assert str(active.pk) in ids
        assert str(inactive.pk) not in ids

    def test_requires_authentication(self):
        self.client.force_authenticate(None)
        resp = self.client.get(self.url)
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED

    def test_response_includes_required_documents(self):
        actor_type = ActorTypeFactory(
            required_documents=[
                {"label": "ID", "required": True, "accepted_formats": ["pdf"]},
            ],
        )
        resp = self.client.get(self.url)
        data = next(d for d in resp.data if d["id"] == str(actor_type.pk))
        assert "required_documents" in data


# ---------------------------------------------------------------------------
# ProfessionalProfile — create
# ---------------------------------------------------------------------------


class TestProfessionalProfileCreate(BaseAPITestCase):
    def setUp(self):
        self.user = UserFactory()
        self.client.force_authenticate(self.user)
        self.url = self.reverse("professional-profile-list")

    def _valid_payload(self, **overrides):
        attrs = {
            "companyName": "Acme Corp",
            "entityType": "company",
            "companyRegistrationNumber": "RC-001",
            "taxIdNumber": "TAX-001",
            "phone": "+2250100000000",
            **overrides,
        }
        return _json_api_payload("ProfessionalProfile", attrs)

    def test_creates_profile_with_free_tier(self):
        resp = self.client.post(self.url, self._valid_payload())
        assert resp.status_code == status.HTTP_201_CREATED
        assert ProfessionalProfile.objects.filter(user=self.user).count() == 1
        profile = ProfessionalProfile.objects.get(user=self.user)
        assert profile.tier == ProfessionalProfile.Tier.FREE

    def test_creates_premium_request_when_tier_premium_submitted(self):
        payload = self._valid_payload()
        payload["data"]["attributes"]["tierRequested"] = "premium"
        resp = self.client.post(self.url, payload)
        assert resp.status_code == status.HTTP_201_CREATED
        profile = ProfessionalProfile.objects.get(user=self.user)
        assert profile.tier == ProfessionalProfile.Tier.FREE  # still free
        assert PremiumUpgradeRequest.objects.filter(
            profile=profile,
            status="pending",
        ).exists()

    def test_returns_409_on_duplicate_profile(self):
        ProfessionalProfileFactory(user=self.user)
        resp = self.client.post(self.url, self._valid_payload())
        assert resp.status_code == status.HTTP_409_CONFLICT

    def test_company_registration_required_for_company_entity(self):
        payload = self._valid_payload(companyRegistrationNumber="")
        resp = self.client.post(self.url, payload)
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_company_registration_not_required_for_individual(self):
        payload = self._valid_payload(
            entityType="individual",
            companyRegistrationNumber="",
        )
        resp = self.client.post(self.url, payload)
        assert resp.status_code == status.HTTP_201_CREATED

    def test_requires_authentication(self):
        self.client.force_authenticate(None)
        resp = self.client.post(self.url, self._valid_payload())
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED


# ---------------------------------------------------------------------------
# ProfessionalProfile — retrieve / patch
# ---------------------------------------------------------------------------


class TestProfessionalProfileRetrieve(BaseAPITestCase):
    def setUp(self):
        self.user = UserFactory()
        self.profile = ProfessionalProfileFactory(user=self.user)
        self.client.force_authenticate(self.user)
        self.url = self.reverse(
            "professional-profile-detail",
            kwargs={"pk": self.profile.pk},
        )

    def test_owner_can_retrieve(self):
        resp = self.client.get(self.url)
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["id"] == str(self.profile.pk)

    def test_other_user_cannot_retrieve(self):
        self.client.force_authenticate(UserFactory())
        resp = self.client.get(self.url)
        assert resp.status_code == status.HTTP_404_NOT_FOUND

    def test_admin_can_retrieve(self):
        admin = UserFactory(is_staff=True)
        self.client.force_authenticate(admin)
        resp = self.client.get(self.url)
        assert resp.status_code == status.HTTP_200_OK


class TestProfessionalProfilePatch(BaseAPITestCase):
    def setUp(self):
        self.user = UserFactory()
        self.profile = ProfessionalProfileFactory(user=self.user)
        self.client.force_authenticate(self.user)
        self.url = self.reverse(
            "professional-profile-detail",
            kwargs={"pk": self.profile.pk},
        )

    def test_owner_can_patch_allowed_fields(self):
        payload = _json_api_payload(
            "ProfessionalProfile",
            {"phone": "+2250199999999"},
            pk=self.profile.pk,
        )
        resp = self.client.patch(self.url, payload)
        assert resp.status_code == status.HTTP_200_OK
        self.profile.refresh_from_db()
        assert self.profile.phone == "+2250199999999"

    def test_tier_is_not_patchable(self):
        payload = _json_api_payload("ProfessionalProfile", {"tier": "premium"})
        self.client.patch(self.url, payload)
        self.profile.refresh_from_db()
        # tier must not have changed
        assert self.profile.tier == ProfessionalProfile.Tier.FREE

    def test_other_user_cannot_patch(self):
        self.client.force_authenticate(UserFactory())
        payload = _json_api_payload("ProfessionalProfile", {"phone": "+0000000000"})
        resp = self.client.patch(self.url, payload)
        assert resp.status_code == status.HTTP_404_NOT_FOUND


# ---------------------------------------------------------------------------
# ProfessionalProfile — request-premium action
# ---------------------------------------------------------------------------


class TestRequestPremium(BaseAPITestCase):
    def setUp(self):
        self.user = UserFactory()
        self.profile = ProfessionalProfileFactory(
            user=self.user,
            tier=ProfessionalProfile.Tier.FREE,
        )
        self.client.force_authenticate(self.user)
        self.url = self.reverse(
            "professional-profile-request-premium",
            kwargs={"pk": self.profile.pk},
        )

    def test_creates_pending_upgrade_request(self):
        resp = self.client.post(self.url)
        assert resp.status_code == status.HTTP_201_CREATED
        assert PremiumUpgradeRequest.objects.filter(
            profile=self.profile,
            status="pending",
        ).exists()

    def test_returns_409_when_pending_request_already_exists(self):
        PremiumUpgradeRequestFactory(
            profile=self.profile,
            status=PremiumUpgradeRequest.Status.PENDING,
        )
        resp = self.client.post(self.url)
        assert resp.status_code == status.HTTP_409_CONFLICT

    def test_returns_422_when_already_premium(self):
        self.profile.tier = ProfessionalProfile.Tier.PREMIUM
        self.profile.save()
        resp = self.client.post(self.url)
        assert resp.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    def test_other_user_cannot_request_premium(self):
        self.client.force_authenticate(UserFactory())
        resp = self.client.post(self.url)
        assert resp.status_code == status.HTTP_404_NOT_FOUND


# ---------------------------------------------------------------------------
# Actor — create
# ---------------------------------------------------------------------------


class TestActorCreate(BaseAPITestCase):
    def setUp(self):
        self.user = UserFactory()
        self.profile = ProfessionalProfileFactory(user=self.user)
        self.actor_type = ActorTypeFactory(requires_validation=True, is_active=True)
        self.client.force_authenticate(self.user)
        self.url = self.reverse("actor-list")

    def _payload(self, actor_type=None):
        at = actor_type or self.actor_type
        return {
            "data": {
                "type": "Actor",
                "attributes": {},
                "relationships": {"actorType": _rel("ActorType", at.pk)},
            },
        }

    def test_creates_pending_actor_when_validation_required(self):
        resp = self.client.post(self.url, self._payload())
        assert resp.status_code == status.HTTP_201_CREATED
        actor = Actor.objects.get(profile=self.profile, actor_type=self.actor_type)
        assert actor.status == Actor.Status.PENDING

    def test_creates_active_actor_when_no_validation_required(self):
        at = ActorTypeFactory(requires_validation=False, is_active=True)
        resp = self.client.post(self.url, self._payload(at))
        assert resp.status_code == status.HTTP_201_CREATED
        actor = Actor.objects.get(profile=self.profile, actor_type=at)
        assert actor.status == Actor.Status.ACTIVE

    def test_returns_409_on_duplicate_actor_type(self):
        ActorFactory(
            profile=self.profile,
            actor_type=self.actor_type,
            status=Actor.Status.PENDING,
        )
        resp = self.client.post(self.url, self._payload())
        assert resp.status_code == status.HTTP_409_CONFLICT

    def test_returns_422_when_actor_type_is_inactive(self):
        at = ActorTypeFactory(is_active=False)
        resp = self.client.post(self.url, self._payload(at))
        assert resp.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    def test_returns_422_when_user_has_no_profile(self):
        user = UserFactory()
        self.client.force_authenticate(user)
        resp = self.client.post(self.url, self._payload())
        assert resp.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


# ---------------------------------------------------------------------------
# Actor — list / retrieve / patch
# ---------------------------------------------------------------------------


class TestActorList(BaseAPITestCase):
    def setUp(self):
        self.user = UserFactory()
        self.profile = ProfessionalProfileFactory(user=self.user)
        self.client.force_authenticate(self.user)
        self.url = self.reverse("actor-list")

    def test_owner_only_sees_own_actors(self):
        own = ActorFactory(profile=self.profile)
        ActorFactory()  # other user's actor

        resp = self.client.get(self.url)

        assert resp.status_code == status.HTTP_200_OK
        ids = [d["id"] for d in resp.data["results"]]
        assert str(own.pk) in ids
        assert len(ids) == 1

    def test_admin_sees_all_actors(self):
        ActorFactory(profile=self.profile)
        ActorFactory()

        admin = UserFactory(is_staff=True)
        self.client.force_authenticate(admin)
        resp = self.client.get(self.url)
        minimum_length = 2

        assert resp.status_code == status.HTTP_200_OK
        assert len(resp.data["results"]) >= minimum_length

    def test_filter_by_status(self):
        ActorFactory(profile=self.profile, status=Actor.Status.ACTIVE)
        ActorFactory(profile=self.profile, status=Actor.Status.PENDING)

        resp = self.client.get(self.url, {"filter[status]": "active"})

        assert resp.status_code == status.HTTP_200_OK
        statuses = [d["status"] for d in resp.data["results"]]
        assert all(s == "active" for s in statuses)


class TestActorPatch(BaseAPITestCase):
    def setUp(self):
        self.user = UserFactory()
        self.profile = ProfessionalProfileFactory(user=self.user)
        self.actor = ActorFactory(profile=self.profile)
        self.client.force_authenticate(self.user)
        self.url = self.reverse("actor-detail", kwargs={"pk": self.actor.pk})

    def test_owner_can_patch_allowed_fields(self):
        payload = _json_api_payload(
            "Actor",
            {"operationRadiusKm": 50, "isAvailable": False},
            pk=self.actor.pk,
        )
        resp = self.client.patch(self.url, payload)
        assert resp.status_code == status.HTTP_200_OK
        self.actor.refresh_from_db()
        expected_radius = 50
        assert self.actor.operation_radius_km == expected_radius

    def test_restricted_fields_ignored(self):
        payload = _json_api_payload(
            "Actor",
            {"status": "active", "reliabilityLevel": "certified"},
        )
        self.client.patch(self.url, payload)
        self.actor.refresh_from_db()
        assert self.actor.status != Actor.Status.ACTIVE

    def test_other_user_cannot_patch(self):
        self.client.force_authenticate(UserFactory())
        payload = _json_api_payload("Actor", {"isAvailable": False})
        resp = self.client.patch(self.url, payload)
        assert resp.status_code == status.HTTP_404_NOT_FOUND


# ---------------------------------------------------------------------------
# Actor — toggle-availability
# ---------------------------------------------------------------------------


class TestToggleAvailability(BaseAPITestCase):
    def setUp(self):
        self.user = UserFactory()
        self.profile = ProfessionalProfileFactory(user=self.user)
        self.actor = ActorFactory(profile=self.profile, is_available=True)
        self.client.force_authenticate(self.user)
        self.url = self.reverse(
            "actor-toggle-availability",
            kwargs={"pk": self.actor.pk},
        )

    def test_toggles_is_available(self):
        resp = self.client.post(self.url)
        assert resp.status_code == status.HTTP_200_OK
        self.actor.refresh_from_db()
        assert not self.actor.is_available

    def test_toggle_twice_restores_original(self):
        self.client.post(self.url)
        self.client.post(self.url)
        self.actor.refresh_from_db()
        assert self.actor.is_available

    def test_other_user_cannot_toggle(self):
        self.client.force_authenticate(UserFactory())
        resp = self.client.post(self.url)
        assert resp.status_code == status.HTTP_404_NOT_FOUND


# ---------------------------------------------------------------------------
# Actor — admin actions
# ---------------------------------------------------------------------------


class TestActorAdminActions(BaseAPITestCase):
    def setUp(self):
        self.admin = UserFactory(is_staff=True)
        self.client.force_authenticate(self.admin)
        self.actor = ActorFactory(status=Actor.Status.PENDING)

    def _url(self, action, pk=None):
        return self.reverse(f"actor-{action}", kwargs={"pk": pk or self.actor.pk})

    def test_validate_sets_status_active(self):
        resp = self.client.post(self._url("validate"))
        assert resp.status_code == status.HTTP_200_OK
        self.actor.refresh_from_db()
        assert self.actor.status == Actor.Status.ACTIVE
        assert self.actor.validated_by == self.admin

    def test_validate_returns_422_for_active_actor(self):
        actor = ActorFactory(status=Actor.Status.ACTIVE)
        resp = self.client.post(self._url("validate", actor.pk))
        assert resp.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    def test_reject_sets_status_rejected(self):
        payload = _json_api_payload("Actor", {"rejectionReason": "Missing docs"})
        resp = self.client.post(self._url("reject"), payload)
        assert resp.status_code == status.HTTP_200_OK
        self.actor.refresh_from_db()
        assert self.actor.status == Actor.Status.REJECTED

    def test_revoke_requires_active_actor(self):
        resp = self.client.post(
            self._url("revoke"),
            _json_api_payload("Actor", {"revocationReason": "Fraud"}),
        )
        assert resp.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    def test_revoke_active_actor(self):
        actor = ActorFactory(status=Actor.Status.ACTIVE)
        resp = self.client.post(
            self._url("revoke", actor.pk),
            _json_api_payload("Actor", {"revocationReason": "Fraud"}),
        )
        assert resp.status_code == status.HTTP_200_OK
        actor.refresh_from_db()
        assert actor.status == Actor.Status.REVOKED

    def test_set_reliability(self):
        resp = self.client.post(
            self._url("set-reliability"),
            _json_api_payload("Actor", {"reliabilityLevel": "certified"}),
        )
        assert resp.status_code == status.HTTP_200_OK
        self.actor.refresh_from_db()
        assert self.actor.reliability_level == Actor.ReliabilityLevel.CERTIFIED

    def test_set_compliance(self):
        resp = self.client.post(
            self._url("set-compliance"),
            _json_api_payload("Actor", {"complianceLevel": "approved"}),
        )
        assert resp.status_code == status.HTTP_200_OK
        self.actor.refresh_from_db()
        assert self.actor.compliance_level == Actor.ComplianceLevel.APPROVED

    def test_set_category_c_approval(self):
        resp = self.client.post(
            self._url("set-category-c-approval"),
            _json_api_payload("Actor", {"approved": True}),
        )
        assert resp.status_code == status.HTTP_200_OK
        self.actor.refresh_from_db()
        assert self.actor.approved_for_category_c

    def test_non_admin_cannot_validate(self):
        self.client.force_authenticate(UserFactory())
        resp = self.client.post(self._url("validate"))
        assert resp.status_code == status.HTTP_403_FORBIDDEN

    def test_non_admin_cannot_reject(self):
        self.client.force_authenticate(UserFactory())
        resp = self.client.post(self._url("reject"))
        assert resp.status_code == status.HTTP_403_FORBIDDEN

    def test_non_admin_cannot_revoke(self):
        self.client.force_authenticate(UserFactory())
        resp = self.client.post(self._url("revoke"))
        assert resp.status_code == status.HTTP_403_FORBIDDEN

    def test_non_admin_cannot_set_reliability(self):
        self.client.force_authenticate(UserFactory())
        resp = self.client.post(self._url("set-reliability"))
        assert resp.status_code == status.HTTP_403_FORBIDDEN

    def test_non_admin_cannot_set_compliance(self):
        self.client.force_authenticate(UserFactory())
        resp = self.client.post(self._url("set-compliance"))
        assert resp.status_code == status.HTTP_403_FORBIDDEN


# ---------------------------------------------------------------------------
# Actor — submit-documents
# ---------------------------------------------------------------------------


class TestSubmitDocuments(BaseAPITestCase):
    def setUp(self):
        self.user = UserFactory()
        self.profile = ProfessionalProfileFactory(user=self.user)
        self.actor_type = ActorTypeFactory(
            requires_validation=True,
            required_documents=[
                {"label": "ID", "required": True, "accepted_formats": ["pdf"]},
            ],
        )
        self.actor = ActorFactory(
            profile=self.profile,
            actor_type=self.actor_type,
            status=Actor.Status.PENDING,
        )
        self.client.force_authenticate(self.user)
        self.url = self.reverse("actor-submit-documents", kwargs={"pk": self.actor.pk})

    def _pdf_file(self, name="doc.pdf"):
        f = io.BytesIO(b"%PDF-1.4 fake content")
        f.name = name
        return f

    def test_creates_document_for_valid_upload(self):
        f = self._pdf_file()
        resp = self.client.post(
            self.url,
            {"doc": f, "label": "Business ID"},
            format="multipart",
        )
        assert resp.status_code == status.HTTP_201_CREATED
        assert ActorDocument.objects.filter(actor=self.actor).count() == 1

    def test_rejects_unsupported_format(self):
        f = io.BytesIO(b"fake")
        f.name = "photo.png"
        resp = self.client.post(
            self.url,
            {"doc": f, "label": "Photo"},
            format="multipart",
        )
        assert resp.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    def test_cannot_submit_when_actor_is_active(self):
        self.actor.status = Actor.Status.ACTIVE
        self.actor.save()
        f = self._pdf_file()
        resp = self.client.post(
            self.url,
            {"doc": f, "label": "ID"},
            format="multipart",
        )
        assert resp.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


# ---------------------------------------------------------------------------
# ActorDocument — delete
# ---------------------------------------------------------------------------


class TestActorDocumentDelete(BaseAPITestCase):
    def setUp(self):
        self.user = UserFactory()
        self.profile = ProfessionalProfileFactory(user=self.user)
        self.actor = ActorFactory(profile=self.profile, status=Actor.Status.PENDING)
        self.document = ActorDocumentFactory(actor=self.actor)
        self.client.force_authenticate(self.user)
        self.url = self.reverse(
            "actor-document-detail",
            kwargs={"pk": self.document.pk},
        )

    def test_owner_can_delete_document(self):
        resp = self.client.delete(self.url)
        assert resp.status_code == status.HTTP_204_NO_CONTENT
        assert not ActorDocument.objects.filter(pk=self.document.pk).exists()

    def test_cannot_delete_when_actor_is_validated(self):
        self.actor.status = Actor.Status.ACTIVE
        self.actor.save()
        resp = self.client.delete(self.url)
        assert resp.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    def test_other_user_cannot_delete(self):
        self.client.force_authenticate(UserFactory())
        resp = self.client.delete(self.url)
        assert resp.status_code == status.HTTP_404_NOT_FOUND


# ---------------------------------------------------------------------------
# PremiumUpgradeRequest — list / retrieve
# ---------------------------------------------------------------------------


class TestPremiumUpgradeRequestList(BaseAPITestCase):
    def setUp(self):
        self.user = UserFactory()
        self.profile = ProfessionalProfileFactory(user=self.user)
        self.client.force_authenticate(self.user)
        self.url = self.reverse("premium-upgrade-request-list")

    def test_owner_sees_only_own_requests(self):
        own = PremiumUpgradeRequestFactory(profile=self.profile)
        PremiumUpgradeRequestFactory()  # other user

        resp = self.client.get(self.url)

        assert resp.status_code == status.HTTP_200_OK
        ids = [d["id"] for d in resp.data["results"]]
        assert str(own.pk) in ids
        assert len(ids) == 1

    def test_admin_sees_all_requests(self):
        PremiumUpgradeRequestFactory(profile=self.profile)
        PremiumUpgradeRequestFactory()

        admin = UserFactory(is_staff=True)
        self.client.force_authenticate(admin)
        resp = self.client.get(self.url)
        minimum_length = 2
        assert resp.status_code == status.HTTP_200_OK
        assert len(resp.data["results"]) >= minimum_length


# ---------------------------------------------------------------------------
# PremiumUpgradeRequest — activate / reject
# ---------------------------------------------------------------------------


class TestPremiumActivate(BaseAPITestCase):
    def setUp(self):
        self.admin = UserFactory(is_staff=True)
        self.profile = ProfessionalProfileFactory()
        self.request_obj = PremiumUpgradeRequestFactory(
            profile=self.profile,
            status=PremiumUpgradeRequest.Status.PENDING,
        )
        self.client.force_authenticate(self.admin)
        self.url = self.reverse(
            "premium-upgrade-request-activate",
            kwargs={"pk": self.request_obj.pk},
        )

    def test_activates_request_and_sets_profile_premium(self):
        payload = _json_api_payload("PremiumUpgradeRequest", {"plan": "monthly"})
        resp = self.client.post(self.url, payload)
        assert resp.status_code == status.HTTP_200_OK
        self.request_obj.refresh_from_db()
        assert self.request_obj.status == PremiumUpgradeRequest.Status.ACTIVATED
        self.profile.refresh_from_db()
        assert self.profile.tier == ProfessionalProfile.Tier.PREMIUM

    def test_annual_plan_sets_365_day_expiry(self):
        payload = _json_api_payload("PremiumUpgradeRequest", {"plan": "annual"})
        self.client.post(self.url, payload)
        self.request_obj.refresh_from_db()
        delta = self.request_obj.expires_at - self.request_obj.activated_at
        assert abs(delta.days - 365) <= 1

    def test_returns_422_for_non_pending_request(self):
        self.request_obj.status = PremiumUpgradeRequest.Status.ACTIVATED
        self.request_obj.save()
        payload = _json_api_payload("PremiumUpgradeRequest", {"plan": "monthly"})
        resp = self.client.post(self.url, payload)
        assert resp.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    def test_non_admin_cannot_activate(self):
        self.client.force_authenticate(UserFactory())
        payload = _json_api_payload("PremiumUpgradeRequest", {"plan": "monthly"})
        resp = self.client.post(self.url, payload)
        assert resp.status_code == status.HTTP_403_FORBIDDEN


class TestPremiumReject(BaseAPITestCase):
    def setUp(self):
        self.admin = UserFactory(is_staff=True)
        self.profile = ProfessionalProfileFactory()
        self.request_obj = PremiumUpgradeRequestFactory(
            profile=self.profile,
            status=PremiumUpgradeRequest.Status.PENDING,
        )
        self.client.force_authenticate(self.admin)
        self.url = self.reverse(
            "premium-upgrade-request-reject",
            kwargs={"pk": self.request_obj.pk},
        )

    def test_rejects_request(self):
        payload = _json_api_payload(
            "PremiumUpgradeRequest",
            {"rejectionReason": "Incomplete documents"},
        )
        resp = self.client.post(self.url, payload)
        assert resp.status_code == status.HTTP_200_OK
        self.request_obj.refresh_from_db()
        assert self.request_obj.status == PremiumUpgradeRequest.Status.REJECTED
        assert self.request_obj.rejection_reason == "Incomplete documents"

    def test_returns_422_for_non_pending_request(self):
        self.request_obj.status = PremiumUpgradeRequest.Status.REJECTED
        self.request_obj.save()
        payload = _json_api_payload(
            "PremiumUpgradeRequest",
            {"rejectionReason": "x"},
        )
        resp = self.client.post(self.url, payload)
        assert resp.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
