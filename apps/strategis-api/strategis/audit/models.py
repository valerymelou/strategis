from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _


class AuditLog(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        verbose_name=_("user"),
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="audit_logs",
    )
    action = models.CharField(_("action"), max_length=255)
    object_type = models.CharField(_("object type"), max_length=100)
    object_id = models.UUIDField(_("object id"))
    detail = models.JSONField(_("detail"), default=dict)
    ip_address = models.GenericIPAddressField(_("IP address"), null=True, blank=True)
    timestamp = models.DateTimeField(_("timestamp"), auto_now_add=True)

    class Meta:
        verbose_name = _("audit log")
        verbose_name_plural = _("audit logs")
        ordering = ["-timestamp"]
        indexes = [
            models.Index(fields=["object_type", "object_id"]),
            models.Index(fields=["action"]),
        ]

    def __str__(self) -> str:
        return f"{self.action} on {self.object_type}({self.object_id})"
