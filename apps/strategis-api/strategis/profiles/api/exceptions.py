from __future__ import annotations

from rest_framework import status
from rest_framework.exceptions import APIException


class BusinessRuleViolation(APIException):
    """
    Raised when a domain business rule is violated (e.g. duplicate actor,
    wrong status transition). Rendered as a JSON:API error by the custom
    exception handler already registered in settings.
    """

    status_code = status.HTTP_409_CONFLICT
    default_detail = "A business rule was violated."
    default_code = "business_rule_violation"

    def __init__(self, detail=None, code=None, status_code=None):
        if status_code is not None:
            self.status_code = status_code
        super().__init__(detail=detail, code=code)
