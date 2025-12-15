from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import upload_settings_view
from .views.csrf_view import CSRFTokenView
from .feature_flags.views import (
    feature_flags_api,
    feature_flag_detail,
    FeatureFlagAdminViewSet
)

app_name = 'core'

router = DefaultRouter()
router.register(r'admin/feature-flags', FeatureFlagAdminViewSet, basename='admin-feature-flags')

urlpatterns = [
    path('upload-settings/', upload_settings_view.UploadSettingsView.as_view(), name='upload-settings'),
    path('csrf-token/', CSRFTokenView.as_view(), name='csrf-token'),
    path('captcha/', include('src.core.security.captcha.urls', namespace='captcha')),
    path('feature-flags/', feature_flags_api, name='feature-flags'),
    path('feature-flags/<str:key>/', feature_flag_detail, name='feature-flag-detail'),
    path('', include(router.urls)),
] 