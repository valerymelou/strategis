from rest_framework.decorators import action
from rest_framework.response import Response

from strategis.core.api.viewsets import BaseModelViewSet
from strategis.users.models import User

from .serializers import UserSerializer


class UserViewSet(BaseModelViewSet):
    """
    ViewSet for user resources.

    Provides a single /me action that returns the currently authenticated user.
    """

    serializer_class = UserSerializer
    queryset = User.objects.none()

    @action(detail=False, methods=["get"], url_path="me")
    def me(self, request):
        """Return the currently authenticated user."""
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)
