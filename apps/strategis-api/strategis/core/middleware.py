from django.conf import settings


class HealthCheckMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Disable host validation for health check endpoint
        if request.path == "/health/":
            request.META["HTTP_HOST"] = settings.ALLOWED_HOSTS[0].lstrip(".")

        return self.get_response(request)
