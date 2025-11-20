from django.conf import settings
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.core.cache import cache
from src.core.responses import APIResponse

class UploadSettingsView(APIView):
    """
    API endpoint برای دریافت تنظیمات آپلود media
    این endpoint تنظیمات را از settings می‌خواند که خودش از .env می‌خواند
    برای بهینه‌سازی، نتایج برای 1 ساعت cache می‌شوند
    """
    permission_classes = [AllowAny]
    CACHE_KEY = 'media_upload_settings'
    CACHE_TIMEOUT = 3600  # 1 hour

    def get(self, request):
        # ✅ بررسی پارامتر clear_cache برای پاک کردن cache
        if request.query_params.get('clear_cache', 'false').lower() == 'true':
            cache.delete(self.CACHE_KEY)
        
        # ✅ Cache برای بهینه‌سازی
        cached_data = cache.get(self.CACHE_KEY)
        if cached_data:
            return APIResponse.success(
                data=cached_data,
                message="Media upload settings retrieved successfully"
            )
        
        # ✅ دریافت تنظیمات از settings (که از env می‌خواند)
        settings_data = {
            'MEDIA_IMAGE_SIZE_LIMIT': settings.MEDIA_FILE_SIZE_LIMITS.get('image'),
            'MEDIA_VIDEO_SIZE_LIMIT': settings.MEDIA_FILE_SIZE_LIMITS.get('video'),
            'MEDIA_AUDIO_SIZE_LIMIT': settings.MEDIA_FILE_SIZE_LIMITS.get('audio'),
            'MEDIA_DOCUMENT_SIZE_LIMIT': settings.MEDIA_FILE_SIZE_LIMITS.get('pdf'),
            'MEDIA_ALLOWED_IMAGE_EXTENSIONS': settings.MEDIA_ALLOWED_EXTENSIONS.get('image', []),
            'MEDIA_ALLOWED_VIDEO_EXTENSIONS': settings.MEDIA_ALLOWED_EXTENSIONS.get('video', []),
            'MEDIA_ALLOWED_AUDIO_EXTENSIONS': settings.MEDIA_ALLOWED_EXTENSIONS.get('audio', []),
            'MEDIA_ALLOWED_PDF_EXTENSIONS': settings.MEDIA_ALLOWED_EXTENSIONS.get('pdf', []),
        }
        
        # ✅ Cache برای 1 ساعت
        cache.set(self.CACHE_KEY, settings_data, self.CACHE_TIMEOUT)
        
        return APIResponse.success(
            data=settings_data,
            message="Media upload settings retrieved successfully"
        )
