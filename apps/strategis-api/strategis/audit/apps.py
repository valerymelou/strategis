from django.apps import AppConfig
from django.utils.translation import gettext_lazy as _


class AuditConfig(AppConfig):
    name = "strategis.audit"
    verbose_name = _("Audit")
