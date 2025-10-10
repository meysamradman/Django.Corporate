from django.urls import path, include
from .views import upload_settings_view
from .views.csrf_view import CSRFTokenView

app_name = 'core'

urlpatterns = [
    path('upload-settings/', upload_settings_view.UploadSettingsView.as_view(), name='upload-settings'),
    path('csrf-token/', CSRFTokenView.as_view(), name='csrf-token'),
    path('captcha/', include('src.core.security.captcha.urls', namespace='captcha')),
] 