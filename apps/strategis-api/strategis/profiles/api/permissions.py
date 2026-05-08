from __future__ import annotations

from rest_framework.permissions import BasePermission


class IsProfileOwner(BasePermission):
    """The authenticated user must own the ProfessionalProfile."""

    def has_object_permission(self, request, view, obj):
        return obj.user_id == request.user.pk


class IsActorOwner(BasePermission):
    """The authenticated user must own the Actor's ProfessionalProfile."""

    def has_object_permission(self, request, view, obj):
        return obj.profile.user_id == request.user.pk


class IsActorDocumentOwner(BasePermission):
    """The authenticated user must own the ActorDocument's actor's profile."""

    def has_object_permission(self, request, view, obj):
        return obj.actor.profile.user_id == request.user.pk


class IsPremiumRequestOwner(BasePermission):
    """The authenticated user must own the PremiumUpgradeRequest's profile."""

    def has_object_permission(self, request, view, obj):
        return obj.profile.user_id == request.user.pk


class IsAdminUser(BasePermission):
    """Staff users only."""

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_staff)

    def has_object_permission(self, request, view, obj):
        return bool(request.user and request.user.is_staff)


class IsOwnerOrAdmin(BasePermission):
    """Allow access to the resource owner or any staff user."""

    def has_object_permission(self, request, view, obj):
        if request.user.is_staff:
            return True
        # Try the various ownership patterns
        if hasattr(obj, "user_id"):
            return obj.user_id == request.user.pk
        if hasattr(obj, "profile"):
            return obj.profile.user_id == request.user.pk
        return False
