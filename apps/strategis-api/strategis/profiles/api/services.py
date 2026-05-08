from __future__ import annotations

from datetime import timedelta

from django.db import transaction
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

from strategis.audit.models import AuditLog
from strategis.profiles.models import Actor
from strategis.profiles.models import ActorDocument
from strategis.profiles.models import PremiumUpgradeRequest
from strategis.profiles.models import ProfessionalProfile

from .exceptions import BusinessRuleViolation

# ---------------------------------------------------------------------------
# Professional Profile
# ---------------------------------------------------------------------------


@transaction.atomic
def create_professional_profile(user, validated_data: dict):
    """Create a ProfessionalProfile for *user*.

    If the caller submitted tier=premium the profile is still created with
    tier=free and a PremiumUpgradeRequest(status=pending) is created alongside.

    Returns (profile, upgrade_request_or_None).
    """
    tier_requested = validated_data.pop("tier_requested", ProfessionalProfile.Tier.FREE)

    profile = ProfessionalProfile.objects.create(
        user=user,
        tier=ProfessionalProfile.Tier.FREE,
        **validated_data,
    )

    upgrade_request = None
    if tier_requested == ProfessionalProfile.Tier.PREMIUM:
        upgrade_request = PremiumUpgradeRequest.objects.create(profile=profile)

    return profile, upgrade_request


def request_premium_upgrade(profile: ProfessionalProfile) -> PremiumUpgradeRequest:
    """
    Create a PremiumUpgradeRequest for *profile* or raise 409 if one is already pending.
    """
    if PremiumUpgradeRequest.objects.filter(
        profile=profile,
        status=PremiumUpgradeRequest.Status.PENDING,
    ).exists():
        raise BusinessRuleViolation(
            detail=_(
                "A pending premium upgrade request already exists for this profile.",
            ),
            code="duplicate_premium_request",
        )
    return PremiumUpgradeRequest.objects.create(profile=profile)


# ---------------------------------------------------------------------------
# Premium Upgrade Request
# ---------------------------------------------------------------------------

_PLAN_DURATIONS = {
    PremiumUpgradeRequest.Plan.MONTHLY: timedelta(days=30),
    PremiumUpgradeRequest.Plan.ANNUAL: timedelta(days=365),
}


@transaction.atomic
def activate_premium(
    request_obj: PremiumUpgradeRequest,
    plan: str,
    admin_user,
) -> PremiumUpgradeRequest:
    if request_obj.status != PremiumUpgradeRequest.Status.PENDING:
        raise BusinessRuleViolation(
            detail=_("Only pending requests can be activated."),
            code="invalid_status_transition",
            status_code=422,
        )

    now = timezone.now()
    request_obj.status = PremiumUpgradeRequest.Status.ACTIVATED
    request_obj.plan = plan
    request_obj.activated_at = now
    request_obj.activated_by = admin_user
    request_obj.expires_at = now + _PLAN_DURATIONS[plan]
    request_obj.save(
        update_fields=[
            "status",
            "plan",
            "activated_at",
            "activated_by",
            "expires_at",
            "modified",
        ],
    )

    request_obj.profile.tier = ProfessionalProfile.Tier.PREMIUM
    request_obj.profile.save(update_fields=["tier", "modified"])

    AuditLog.objects.create(
        user=admin_user,
        action="premium.activated",
        object_type="PremiumUpgradeRequest",
        object_id=request_obj.pk,
        detail={"plan": plan, "expires_at": request_obj.expires_at.isoformat()},
    )

    # TODO: trigger premium_activated email

    return request_obj


@transaction.atomic
def reject_premium(
    request_obj: PremiumUpgradeRequest,
    reason: str,
    admin_user,
) -> PremiumUpgradeRequest:
    if request_obj.status != PremiumUpgradeRequest.Status.PENDING:
        raise BusinessRuleViolation(
            detail=_("Only pending requests can be rejected."),
            code="invalid_status_transition",
            status_code=422,
        )

    request_obj.status = PremiumUpgradeRequest.Status.REJECTED
    request_obj.rejected_at = timezone.now()
    request_obj.rejection_reason = reason
    request_obj.save(
        update_fields=["status", "rejected_at", "rejection_reason", "modified"],
    )

    AuditLog.objects.create(
        user=admin_user,
        action="premium.rejected",
        object_type="PremiumUpgradeRequest",
        object_id=request_obj.pk,
        detail={"reason": reason},
    )

    # TODO: trigger premium_rejected email

    return request_obj


# ---------------------------------------------------------------------------
# Actor
# ---------------------------------------------------------------------------


@transaction.atomic
def create_actor(
    profile: ProfessionalProfile,
    actor_type,
    validated_data: dict,
) -> Actor:
    """Declare a new Actor role on *profile*. Raises 409 on duplicate."""
    active_statuses = {
        Actor.Status.PENDING,
        Actor.Status.ACTIVE,
        Actor.Status.AWAITING_DOCUMENTS,
    }
    if Actor.objects.filter(
        profile=profile,
        actor_type=actor_type,
        status__in=active_statuses,
    ).exists():
        raise BusinessRuleViolation(
            detail="This actor type is already declared on the profile.",
            code="duplicate_actor",
        )

    if not actor_type.is_active:
        raise BusinessRuleViolation(
            detail="This actor type is not active.",
            code="inactive_actor_type",
            status_code=422,
        )

    status = (
        Actor.Status.ACTIVE
        if not actor_type.requires_validation
        else Actor.Status.PENDING
    )
    return Actor.objects.create(
        profile=profile,
        actor_type=actor_type,
        status=status,
        **validated_data,
    )


@transaction.atomic
def validate_actor(actor: Actor, admin_user) -> Actor:
    _require_status(
        actor,
        {Actor.Status.PENDING, Actor.Status.AWAITING_DOCUMENTS},
        "validate",
    )
    actor.status = Actor.Status.ACTIVE
    actor.validated_by = admin_user
    actor.validated_at = timezone.now()
    actor.save(update_fields=["status", "validated_by", "validated_at", "modified"])

    AuditLog.objects.create(
        user=admin_user,
        action="actor.validated",
        object_type="Actor",
        object_id=actor.pk,
        detail={},
    )
    # TODO: trigger actor_validated email
    return actor


@transaction.atomic
def reject_actor(actor: Actor, reason: str, admin_user) -> Actor:
    _require_status(
        actor,
        {Actor.Status.PENDING, Actor.Status.AWAITING_DOCUMENTS},
        "reject",
    )
    actor.status = Actor.Status.REJECTED
    actor.rejection_reason = reason
    actor.save(update_fields=["status", "rejection_reason", "modified"])

    AuditLog.objects.create(
        user=admin_user,
        action="actor.rejected",
        object_type="Actor",
        object_id=actor.pk,
        detail={"reason": reason},
    )
    # TODO: trigger actor_rejected email
    return actor


@transaction.atomic
def revoke_actor(actor: Actor, reason: str, admin_user) -> Actor:
    _require_status(
        actor,
        {Actor.Status.ACTIVE},
        "revoke",
    )
    actor.status = Actor.Status.REVOKED
    actor.revocation_reason = reason
    actor.save(update_fields=["status", "revocation_reason", "modified"])

    AuditLog.objects.create(
        user=admin_user,
        action="actor.revoked",
        object_type="Actor",
        object_id=actor.pk,
        detail={"reason": reason},
    )
    # TODO: trigger actor_revoked email
    return actor


def toggle_actor_availability(actor: Actor) -> Actor:
    actor.is_available = not actor.is_available
    actor.save(update_fields=["is_available", "modified"])
    return actor


def set_reliability(actor: Actor, reliability_level: str, admin_user) -> Actor:
    actor.reliability_level = reliability_level
    actor.save(update_fields=["reliability_level", "modified"])
    AuditLog.objects.create(
        user=admin_user,
        action="actor.reliability_set",
        object_type="Actor",
        object_id=actor.pk,
        detail={"reliability_level": reliability_level},
    )
    return actor


def set_compliance(actor: Actor, compliance_level: str, admin_user) -> Actor:
    actor.compliance_level = compliance_level
    actor.save(update_fields=["compliance_level", "modified"])
    AuditLog.objects.create(
        user=admin_user,
        action="actor.compliance_set",
        object_type="Actor",
        object_id=actor.pk,
        detail={"compliance_level": compliance_level},
    )
    return actor


def set_category_c_approval(actor: Actor, approved, admin_user) -> Actor:
    actor.approved_for_category_c = approved
    actor.save(update_fields=["approved_for_category_c", "modified"])
    AuditLog.objects.create(
        user=admin_user,
        action="actor.category_c_approval_set",
        object_type="Actor",
        object_id=actor.pk,
        detail={"approved": approved},
    )
    return actor


# ---------------------------------------------------------------------------
# Actor Documents
# ---------------------------------------------------------------------------

_VALID_DOCUMENT_STATUSES = {Actor.Status.PENDING, Actor.Status.AWAITING_DOCUMENTS}


def create_actor_documents(actor: Actor, files: list[dict]) -> list[ActorDocument]:
    """Create ActorDocument records for each item in *files*.

    Each item must be a dict with keys ``label`` and ``file``.
    Validates extension against actor_type.required_documents[].accepted_formats.
    """
    if actor.status not in _VALID_DOCUMENT_STATUSES:
        raise BusinessRuleViolation(
            detail=(
                "Documents can only be submitted when the actor is "
                "pending or awaiting documents."
            ),
            code="invalid_actor_status",
            status_code=422,
        )

    accepted_formats: set[str] = set()
    for doc_spec in actor.actor_type.required_documents or []:
        accepted_formats.update(
            f.lower() for f in (doc_spec.get("accepted_formats") or [])
        )

    documents = []
    for item in files:
        file_obj = item["file"]
        if accepted_formats:
            ext = (
                file_obj.name.rsplit(".", 1)[-1].lower() if "." in file_obj.name else ""
            )
            if ext not in accepted_formats:
                raise BusinessRuleViolation(
                    detail=_("File %s has an unsupported format. Accepted: %s")
                    % (file_obj.name, ", ".join(sorted(accepted_formats))),
                    code="unsupported_file_format",
                    status_code=422,
                )
        documents.append(
            ActorDocument(
                actor=actor,
                label=item["label"],
                file=file_obj,
                is_required=True,
            ),
        )
    # TODO: trigger actor_validation_request email to admins

    return ActorDocument.objects.bulk_create(documents)


def delete_actor_document(document: ActorDocument) -> None:
    if document.actor.status not in _VALID_DOCUMENT_STATUSES:
        raise BusinessRuleViolation(
            detail=_(
                "Documents can only be deleted when the actor is pending "
                "or awaiting documents.",
            ),
            code="invalid_actor_status",
            status_code=422,
        )
    document.delete()


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _require_status(actor: Actor, allowed: set, action: str) -> None:
    if actor.status not in allowed:
        raise BusinessRuleViolation(
            detail=f"Cannot {action} an actor with status '{actor.status}'.",
            code="invalid_status_transition",
            status_code=422,
        )
