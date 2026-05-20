"""
API tests for the waste app — CEDCode endpoints.

Test strategy:
  - Use BaseAPITestCase.client (APIClient) which sends JSON:API content-type.
  - Auth is handled via force_authenticate (no JWT internals tested here).
  - One test class per action / logical group.
"""

from __future__ import annotations

from rest_framework import status

from strategis.core.tests import BaseAPITestCase
from strategis.users.tests.factories import UserFactory
from strategis.waste.models import CEDCode
from strategis.waste.tests.factories import CEDCodeFactory


def _payload(attributes: dict, pk=None) -> dict:
    """Build a minimal JSON:API request body for CEDCode."""
    data: dict = {"data": {"type": "CEDCode", "attributes": attributes}}
    if pk is not None:
        data["data"]["id"] = str(pk)
    return data


def _valid_attrs(**overrides) -> dict:
    return {
        "code": "TST 9999",
        "chapterCode": "17",
        "subCategoryCode": "17 02",
        "subCategoryLabel": "Wood, glass, plastics",
        "label": "Mixed construction waste",
        "isHazardous": False,
        "category": "A",
        "subCategoryA": "",
        "subCategoryALabel": "",
        "allowedUnits": ["kg"],
        "pointsPerUnit": None,
        "referenceScenario": "",
        "isActive": True,
        **overrides,
    }


# ---------------------------------------------------------------------------
# Model
# ---------------------------------------------------------------------------


class TestCEDCodeModel(BaseAPITestCase):
    def test_str_representation(self):
        ced = CEDCodeFactory.build(code="17 02 01", label="Wood")
        assert str(ced) == "17 02 01 — Wood"


# ---------------------------------------------------------------------------
# List  GET /v1/ced-codes/
# ---------------------------------------------------------------------------


class TestCEDCodeList(BaseAPITestCase):
    def setUp(self):
        self.user = UserFactory()
        self.client.force_authenticate(self.user)
        self.url = self.reverse("ced-code-list")

    def test_authenticated_user_can_list(self):
        resp = self.client.get(self.url)

        assert resp.status_code == status.HTTP_200_OK
        assert "results" in resp.data

    def test_unauthenticated_cannot_list(self):
        self.client.force_authenticate(None)

        resp = self.client.get(self.url)

        assert resp.status_code == status.HTTP_401_UNAUTHORIZED

    def test_filter_by_category(self):
        a = CEDCodeFactory(code="TST-CAT-A", category=CEDCode.Category.A)
        b = CEDCodeFactory(code="TST-CAT-B", category=CEDCode.Category.B)

        resp = self.client.get(
            self.url,
            {"filter[category]": "A", "filter[search]": "TST-CAT"},
        )

        ids = [item["id"] for item in resp.data["results"]]
        assert str(a.pk) in ids
        assert str(b.pk) not in ids

    def test_filter_by_is_hazardous(self):
        hazardous = CEDCodeFactory(code="TST-HAZ-Y", is_hazardous=True)
        safe = CEDCodeFactory(code="TST-HAZ-N", is_hazardous=False)

        resp = self.client.get(
            self.url,
            {"filter[isHazardous]": "true", "filter[search]": "TST-HAZ"},
        )

        ids = [item["id"] for item in resp.data["results"]]
        assert str(hazardous.pk) in ids
        assert str(safe.pk) not in ids

    def test_filter_by_is_active(self):
        active = CEDCodeFactory(code="TST-ACT-Y", is_active=True)
        inactive = CEDCodeFactory(code="TST-ACT-N", is_active=False)

        resp = self.client.get(
            self.url,
            {"filter[isActive]": "false", "filter[search]": "TST-ACT"},
        )

        ids = [item["id"] for item in resp.data["results"]]
        assert str(inactive.pk) in ids
        assert str(active.pk) not in ids

    def test_search_by_code(self):
        target = CEDCodeFactory(code="TST-SRCH-1")
        other = CEDCodeFactory(code="TST-SRCH-2")

        resp = self.client.get(self.url, {"filter[search]": "TST-SRCH-1"})

        ids = [item["id"] for item in resp.data["results"]]
        assert str(target.pk) in ids
        assert str(other.pk) not in ids

    def test_search_by_label(self):
        target = CEDCodeFactory(code="TST-LBL-1", label="TSTLBL unique wood marker")
        CEDCodeFactory(code="TST-LBL-2", label="TSTLBL unique plastic marker")

        resp = self.client.get(self.url, {"filter[search]": "TSTLBL unique wood"})

        ids = [item["id"] for item in resp.data["results"]]
        assert str(target.pk) in ids

    def test_results_ordered_by_code(self):
        CEDCodeFactory(code="TST-ORD-Z")
        CEDCodeFactory(code="TST-ORD-A")

        resp = self.client.get(self.url, {"filter[search]": "TST-ORD"})

        codes = [item["code"] for item in resp.data["results"]]
        assert codes == sorted(codes)


# ---------------------------------------------------------------------------
# Retrieve  GET /v1/ced-codes/<id>/
# ---------------------------------------------------------------------------


class TestCEDCodeRetrieve(BaseAPITestCase):
    def setUp(self):
        self.user = UserFactory()
        self.client.force_authenticate(self.user)
        self.ced = CEDCodeFactory()
        self.url = self.reverse("ced-code-detail", kwargs={"pk": self.ced.pk})

    def test_authenticated_user_can_retrieve(self):
        resp = self.client.get(self.url)

        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["id"] == str(self.ced.pk)
        assert resp.data["code"] == self.ced.code

    def test_unauthenticated_cannot_retrieve(self):
        self.client.force_authenticate(None)

        resp = self.client.get(self.url)

        assert resp.status_code == status.HTTP_401_UNAUTHORIZED

    def test_response_contains_expected_attributes(self):
        resp = self.client.get(self.url)

        data = resp.data
        for field in [
            "code",
            "chapter_code",
            "sub_category_code",
            "sub_category_label",
            "label",
            "is_hazardous",
            "category",
            "allowed_units",
            "is_active",
        ]:
            assert field in data, f"Missing field: {field}"


# ---------------------------------------------------------------------------
# Create  POST /v1/ced-codes/
# ---------------------------------------------------------------------------


class TestCEDCodeCreate(BaseAPITestCase):
    def setUp(self):
        self.url = self.reverse("ced-code-list")

    def test_staff_can_create(self):
        staff = UserFactory(is_staff=True)
        self.client.force_authenticate(staff)

        resp = self.client.post(self.url, _payload(_valid_attrs()))

        assert resp.status_code == status.HTTP_201_CREATED
        assert CEDCode.objects.filter(code="TST 9999").exists()

    def test_regular_user_cannot_create(self):
        user = UserFactory(is_staff=False)
        self.client.force_authenticate(user)

        resp = self.client.post(self.url, _payload(_valid_attrs()))

        assert resp.status_code == status.HTTP_403_FORBIDDEN

    def test_unauthenticated_cannot_create(self):
        resp = self.client.post(self.url, _payload(_valid_attrs()))

        assert resp.status_code == status.HTTP_401_UNAUTHORIZED

    def test_duplicate_code_returns_400(self):
        staff = UserFactory(is_staff=True)
        self.client.force_authenticate(staff)
        CEDCodeFactory(code="TST 9999")

        resp = self.client.post(self.url, _payload(_valid_attrs(code="TST 9999")))

        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_create_persists_all_fields(self):
        staff = UserFactory(is_staff=True)
        self.client.force_authenticate(staff)
        attrs = _valid_attrs(
            allowedUnits=["kg", "ton"],
            pointsPerUnit="2.50",
            subCategoryA="A01",
            subCategoryALabel="Sub A",
            referenceScenario="REF01",
        )

        resp = self.client.post(self.url, _payload(attrs))

        assert resp.status_code == status.HTTP_201_CREATED
        ced = CEDCode.objects.get(code="TST 9999")
        assert ced.allowed_units == ["kg", "ton"]
        assert str(ced.points_per_unit) == "2.50"
        assert ced.sub_category_a == "A01"
        assert ced.reference_scenario == "REF01"


# ---------------------------------------------------------------------------
# Update  PATCH /v1/ced-codes/<id>/
# ---------------------------------------------------------------------------


class TestCEDCodeUpdate(BaseAPITestCase):
    def setUp(self):
        self.ced = CEDCodeFactory(label="Original label")
        self.url = self.reverse("ced-code-detail", kwargs={"pk": self.ced.pk})

    def test_staff_can_patch(self):
        staff = UserFactory(is_staff=True)
        self.client.force_authenticate(staff)

        resp = self.client.patch(
            self.url,
            _payload({"label": "Updated label"}, pk=self.ced.pk),
        )

        assert resp.status_code == status.HTTP_200_OK
        self.ced.refresh_from_db()
        assert self.ced.label == "Updated label"

    def test_regular_user_cannot_patch(self):
        user = UserFactory(is_staff=False)
        self.client.force_authenticate(user)

        resp = self.client.patch(
            self.url,
            _payload({"label": "Updated label"}, pk=self.ced.pk),
        )

        assert resp.status_code == status.HTTP_403_FORBIDDEN

    def test_unauthenticated_cannot_patch(self):
        resp = self.client.patch(
            self.url,
            _payload({"label": "Updated label"}, pk=self.ced.pk),
        )

        assert resp.status_code == status.HTTP_401_UNAUTHORIZED

    def test_patch_code_uniqueness_validated(self):
        staff = UserFactory(is_staff=True)
        self.client.force_authenticate(staff)
        other = CEDCodeFactory()

        resp = self.client.patch(
            self.url,
            _payload({"code": other.code}, pk=self.ced.pk),
        )

        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_patch_code_same_instance_allowed(self):
        """Patching the code with the same value must not trigger uniqueness error."""
        staff = UserFactory(is_staff=True)
        self.client.force_authenticate(staff)

        resp = self.client.patch(
            self.url,
            _payload({"code": self.ced.code}, pk=self.ced.pk),
        )

        assert resp.status_code == status.HTTP_200_OK


# ---------------------------------------------------------------------------
# Destroy  DELETE /v1/ced-codes/<id>/
# ---------------------------------------------------------------------------


class TestCEDCodeDestroy(BaseAPITestCase):
    def test_staff_can_delete(self):
        staff = UserFactory(is_staff=True)
        self.client.force_authenticate(staff)
        ced = CEDCodeFactory()
        url = self.reverse("ced-code-detail", kwargs={"pk": ced.pk})

        resp = self.client.delete(url)

        assert resp.status_code == status.HTTP_204_NO_CONTENT
        assert not CEDCode.objects.filter(pk=ced.pk).exists()

    def test_regular_user_cannot_delete(self):
        user = UserFactory(is_staff=False)
        self.client.force_authenticate(user)
        ced = CEDCodeFactory()
        url = self.reverse("ced-code-detail", kwargs={"pk": ced.pk})

        resp = self.client.delete(url)

        assert resp.status_code == status.HTTP_403_FORBIDDEN
        assert CEDCode.objects.filter(pk=ced.pk).exists()

    def test_unauthenticated_cannot_delete(self):
        ced = CEDCodeFactory()
        url = self.reverse("ced-code-detail", kwargs={"pk": ced.pk})

        resp = self.client.delete(url)

        assert resp.status_code == status.HTTP_401_UNAUTHORIZED
