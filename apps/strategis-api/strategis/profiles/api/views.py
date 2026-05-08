from __future__ import annotations

from django.utils.translation import gettext_lazy as _
from rest_framework import mixins
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from strategis.core.api.viewsets import BaseModelViewSet
from strategis.profiles.models import Actor
from strategis.profiles.models import ActorDocument
from strategis.profiles.models import ActorType
from strategis.profiles.models import PremiumUpgradeRequest
from strategis.profiles.models import ProfessionalProfile

from . import services
from .exceptions import BusinessRuleViolation
from .permissions import IsAdminUser
from .serializers import ActorCategoryCSerializer
from .serializers import ActorComplianceSerializer
from .serializers import ActorCreateSerializer
from .serializers import ActorDocumentSerializer
from .serializers import ActorRejectSerializer
from .serializers import ActorReliabilitySerializer
from .serializers import ActorRevokeSerializer
from .serializers import ActorSerializer
from .serializers import ActorTypeSerializer
from .serializers import ActorUpdateSerializer
from .serializers import PremiumActivateSerializer
from .serializers import PremiumRejectSerializer
from .serializers import PremiumUpgradeRequestSerializer
from .serializers import ProfessionalProfileCreateSerializer
from .serializers import ProfessionalProfileSerializer
from .serializers import ProfessionalProfileUpdateSerializer

# ---------------------------------------------------------------------------
# ActorType
# ---------------------------------------------------------------------------


class ActorTypeViewSet(
    mixins.ListModelMixin,
    BaseModelViewSet,
):
    queryset = ActorType.objects.filter(is_active=True)
    serializer_class = ActorTypeSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None  # small static list — no pagination needed


# ---------------------------------------------------------------------------
# ProfessionalProfile
# ---------------------------------------------------------------------------


class ProfessionalProfileViewSet(
    mixins.CreateModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    BaseModelViewSet,
):
    http_method_names = ["get", "post", "patch", "head", "options"]
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return ProfessionalProfile.objects.all()
        return ProfessionalProfile.objects.filter(user=user)

    def get_serializer_class(self):
        if self.action == "create":
            return ProfessionalProfileCreateSerializer
        if self.action in ("update", "partial_update"):
            return ProfessionalProfileUpdateSerializer
        return ProfessionalProfileSerializer

    def create(self, request, *args, **kwargs):
        if ProfessionalProfile.objects.filter(user=request.user).exists():
            raise BusinessRuleViolation(
                detail=_("A professional profile already exists for this user."),
                code="duplicate_profile",
            )
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        profile, __ = services.create_professional_profile(
            user=request.user,
            validated_data=serializer.validated_data,
        )

        response_serializer = ProfessionalProfileSerializer(
            profile,
            context=self.get_serializer_context(),
        )
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)

    @action(
        detail=True,
        methods=["post"],
        url_path="request-premium",
        url_name="request-premium",
    )
    def request_premium(self, request, pk=None):
        profile = self.get_object()
        if profile.tier != ProfessionalProfile.Tier.FREE:
            raise BusinessRuleViolation(
                detail=_("Only free-tier profiles can request a premium upgrade."),
                code="already_premium",
                status_code=422,
            )
        upgrade_request = services.request_premium_upgrade(profile)
        serializer = PremiumUpgradeRequestSerializer(
            upgrade_request,
            context=self.get_serializer_context(),
        )
        return Response(serializer.data, status=status.HTTP_201_CREATED)


# ---------------------------------------------------------------------------
# PremiumUpgradeRequest
# ---------------------------------------------------------------------------


class PremiumUpgradeRequestViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    BaseModelViewSet,
):
    serializer_class = PremiumUpgradeRequestSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return PremiumUpgradeRequest.objects.select_related(
                "profile",
                "activated_by",
            ).all()
        return PremiumUpgradeRequest.objects.select_related("profile").filter(
            profile__user=user,
        )

    permission_classes = [IsAuthenticated]
    filterset_fields = ["status"]

    def get_permissions(self):
        if self.action in ("activate", "reject"):
            return [IsAuthenticated(), IsAdminUser()]
        return [IsAuthenticated()]

    @action(detail=True, methods=["post"])
    def activate(self, request, pk=None):
        obj = self.get_object()
        serializer = PremiumActivateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        updated = services.activate_premium(
            obj,
            serializer.validated_data["plan"],
            request.user,
        )
        return Response(
            PremiumUpgradeRequestSerializer(
                updated,
                context=self.get_serializer_context(),
            ).data,
        )

    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        obj = self.get_object()
        serializer = PremiumRejectSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        updated = services.reject_premium(
            obj,
            serializer.validated_data["rejection_reason"],
            request.user,
        )
        return Response(
            PremiumUpgradeRequestSerializer(
                updated,
                context=self.get_serializer_context(),
            ).data,
        )


# ---------------------------------------------------------------------------
# Actor
# ---------------------------------------------------------------------------


class ActorViewSet(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    BaseModelViewSet,
):
    http_method_names = ["get", "post", "patch", "head", "options"]
    filterset_fields = ["status", "actor_type"]

    def get_queryset(self):
        user = self.request.user
        qs = Actor.objects.select_related("profile", "actor_type").prefetch_related(
            "documents",
        )
        if user.is_staff:
            return qs.all()
        return qs.filter(profile__user=user)

    def get_serializer_class(self):
        if self.action == "create":
            return ActorCreateSerializer
        if self.action in ("update", "partial_update"):
            return ActorUpdateSerializer
        return ActorSerializer

    def get_permissions(self):
        admin_actions = {
            "validate",
            "reject",
            "revoke",
            "set_reliability",
            "set_compliance",
            "set_category_c_approval",
        }
        if self.action in admin_actions:
            return [IsAuthenticated(), IsAdminUser()]
        return [IsAuthenticated()]

    def create(self, request, *args, **kwargs):
        try:
            profile = request.user.professional_profile
        except ProfessionalProfile.DoesNotExist as e:
            raise BusinessRuleViolation(
                detail=_(
                    "You must have a professional profile to declare an actor role.",
                ),
                code="no_profile",
                status_code=422,
            ) from e

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        actor_type = serializer.validated_data.pop("actor_type")

        actor = services.create_actor(
            profile=profile,
            actor_type=actor_type,
            validated_data=serializer.validated_data,
        )

        response_serializer = ActorSerializer(
            actor,
            context=self.get_serializer_context(),
        )
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)

    @action(
        detail=True,
        methods=["post"],
        url_path="submit-documents",
        url_name="submit-documents",
        parser_classes=[MultiPartParser],
    )
    def submit_documents(self, request, pk=None):
        actor = self.get_object()
        # Accept multiple files — each must have label + file
        files_data = []
        for key in request.FILES:
            label = request.data.get(f"{key}_label") or request.data.get("label", key)
            files_data.append({"label": label, "file": request.FILES[key]})

        if not files_data:
            raise BusinessRuleViolation(
                detail="At least one file must be submitted.",
                code="no_files",
                status_code=422,
            )

        documents = services.create_actor_documents(actor, files_data)
        serializer = ActorDocumentSerializer(
            documents,
            many=True,
            context=self.get_serializer_context(),
        )
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(
        detail=True,
        methods=["post"],
        url_path="toggle-availability",
        url_name="toggle-availability",
    )
    def toggle_availability(self, request, pk=None):
        actor = self.get_object()
        updated = services.toggle_actor_availability(actor)
        return Response(
            ActorSerializer(updated, context=self.get_serializer_context()).data,
        )

    # Admin actions

    @action(detail=True, methods=["post"])
    def validate(self, request, pk=None):
        actor = self.get_object()
        updated = services.validate_actor(actor, request.user)
        return Response(
            ActorSerializer(updated, context=self.get_serializer_context()).data,
        )

    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        actor = self.get_object()
        serializer = ActorRejectSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        updated = services.reject_actor(
            actor,
            serializer.validated_data["rejection_reason"],
            request.user,
        )
        return Response(
            ActorSerializer(updated, context=self.get_serializer_context()).data,
        )

    @action(detail=True, methods=["post"])
    def revoke(self, request, pk=None):
        actor = self.get_object()
        serializer = ActorRevokeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        updated = services.revoke_actor(
            actor,
            serializer.validated_data["revocation_reason"],
            request.user,
        )
        return Response(
            ActorSerializer(updated, context=self.get_serializer_context()).data,
        )

    @action(
        detail=True,
        methods=["post"],
        url_path="set-reliability",
        url_name="set-reliability",
    )
    def set_reliability(self, request, pk=None):
        actor = self.get_object()
        serializer = ActorReliabilitySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        updated = services.set_reliability(
            actor,
            serializer.validated_data["reliability_level"],
            request.user,
        )
        return Response(
            ActorSerializer(updated, context=self.get_serializer_context()).data,
        )

    @action(
        detail=True,
        methods=["post"],
        url_path="set-compliance",
        url_name="set-compliance",
    )
    def set_compliance(self, request, pk=None):
        actor = self.get_object()
        serializer = ActorComplianceSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        updated = services.set_compliance(
            actor,
            serializer.validated_data["compliance_level"],
            request.user,
        )
        return Response(
            ActorSerializer(updated, context=self.get_serializer_context()).data,
        )

    @action(
        detail=True,
        methods=["post"],
        url_path="set-category-c-approval",
        url_name="set-category-c-approval",
    )
    def set_category_c_approval(self, request, pk=None):
        actor = self.get_object()
        serializer = ActorCategoryCSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        updated = services.set_category_c_approval(
            actor,
            serializer.validated_data["approved"],
            request.user,
        )
        return Response(
            ActorSerializer(updated, context=self.get_serializer_context()).data,
        )


# ---------------------------------------------------------------------------
# ActorDocument
# ---------------------------------------------------------------------------


class ActorDocumentViewSet(
    mixins.DestroyModelMixin,
    BaseModelViewSet,
):
    serializer_class = ActorDocumentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ActorDocument.objects.select_related("actor__profile").filter(
            actor__profile__user=self.request.user,
        )

    def destroy(self, request, *args, **kwargs):
        document = self.get_object()
        services.delete_actor_document(document)
        return Response(status=status.HTTP_204_NO_CONTENT)
