from rest_framework.routers import SimpleRouter

from .views import CEDCodeViewSet

router = SimpleRouter()
router.register("ced-codes", CEDCodeViewSet, basename="ced-code")

urlpatterns = router.urls
