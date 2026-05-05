from rest_framework.viewsets import GenericViewSet
from rest_framework_json_api.views import AutoPrefetchMixin
from rest_framework_json_api.views import PreloadIncludesMixin
from rest_framework_json_api.views import RelatedMixin


class BaseModelViewSet(
    AutoPrefetchMixin,
    PreloadIncludesMixin,
    RelatedMixin,
    GenericViewSet,
):
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]
