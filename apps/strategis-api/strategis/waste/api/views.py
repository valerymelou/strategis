from __future__ import annotations

from rest_framework import mixins
from rest_framework.permissions import IsAuthenticated

from strategis.core.api.viewsets import BaseModelViewSet
from strategis.profiles.api.permissions import IsAdminUser
from strategis.waste.models import CEDCode

from .serializers import CEDCodeSerializer


class CEDCodeViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.CreateModelMixin,
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
    BaseModelViewSet,
):
    """
    Manage CED waste codes.

    - Any authenticated user can list / retrieve (needed when declaring a WasteLot).
    - Only staff can create or update codes.

    Filtering  : ?filter[category]=A
                 ?filter[isHazardous]=true
                 ?filter[isActive]=true
    Search     : ?filter[search]=12+01
    Ordering   : ?sort=code  |  ?sort=-category
    """

    queryset = CEDCode.objects.all()
    filterset_fields = ["category", "is_hazardous", "is_active"]
    search_fields = ["code", "label", "sub_category_label", "chapter_code"]
    ordering_fields = ["code", "category", "sub_category_a", "is_active"]
    ordering = ["code"]

    serializer_class = CEDCodeSerializer

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update", "destroy"):
            return [IsAdminUser()]
        return [IsAuthenticated()]
