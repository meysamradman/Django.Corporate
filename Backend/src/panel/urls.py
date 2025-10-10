from django.urls import include, path
from rest_framework.routers import DefaultRouter
from src.panel.views import AdminPanelSettingsViewSet

router = DefaultRouter()
router.register(r'admin/panel-settings', AdminPanelSettingsViewSet, basename='admin-panel-settings')

urlpatterns = [
    path('', include(router.urls)),
]


