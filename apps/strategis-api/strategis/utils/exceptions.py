"""Custom DRF exception handler to ensure correct status codes.

We delegate to the JSON:API exception handler but normalize auth-related
exceptions (AuthenticationFailed/NotAuthenticated) to return HTTP 401.
"""

from rest_framework import status
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.exceptions import NotAuthenticated
from rest_framework.views import exception_handler as drf_exception_handler
from rest_framework_json_api.exceptions import (
    exception_handler as jsonapi_exception_handler,
)


def custom_exception_handler(exc, context):
    """Return a DRF Response for exceptions with correct auth status codes.

    - Use JSON:API handler if available to keep error formatting consistent.
    - Normalize AuthenticationFailed/NotAuthenticated to 401 Unauthorized.
    """

    response = None
    if jsonapi_exception_handler is not None:
        response = jsonapi_exception_handler(exc, context)
    else:
        response = drf_exception_handler(exc, context)

    if response is None:
        return None

    if isinstance(exc, (AuthenticationFailed, NotAuthenticated)):
        response.status_code = status.HTTP_401_UNAUTHORIZED

    return response
