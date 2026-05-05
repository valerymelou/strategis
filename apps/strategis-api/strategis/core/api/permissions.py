from rest_framework.permissions import BasePermission


class IsOwner(BasePermission):
    """Object-level permission. Applied only to write/upload actions on the
    FounderViewSet, so ownership is always required unconditionally."""

    def has_object_permission(self, request, view, obj):
        return obj.user == request.user
