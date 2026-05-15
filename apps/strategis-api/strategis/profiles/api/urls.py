from rest_framework.routers import SimpleRouter

from .views import ActorDocumentViewSet
from .views import ActorTypeViewSet
from .views import ActorViewSet
from .views import PremiumUpgradeRequestViewSet
from .views import ProfessionalProfileViewSet

router = SimpleRouter()
router.register("actor-types", ActorTypeViewSet, basename="actor-type")
router.register(
    "professional-profiles",
    ProfessionalProfileViewSet,
    basename="professional-profile",
)
router.register("actors", ActorViewSet, basename="actor")
router.register("actor-documents", ActorDocumentViewSet, basename="actor-document")
router.register(
    "premium-upgrade-requests",
    PremiumUpgradeRequestViewSet,
    basename="premium-upgrade-request",
)

urlpatterns = router.urls
