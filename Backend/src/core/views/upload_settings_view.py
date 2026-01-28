from django.conf import settings
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from django.core.cache import cache
from src.core.responses.response import APIResponse
from src.core.messages.messages import CORE_SUCCESS

class UploadSettingsView(APIView):
    permission_classes = [AllowAny]
    CACHE_KEY = 'media_upload_settings'
    CACHE_TIMEOUT = 3600

    def get(self, request):
        if request.query_params.get('clear_cache', 'false').lower() == 'true':
            cache.delete(self.CACHE_KEY)
        
        cached_data = cache.get(self.CACHE_KEY)
        if cached_data:
            return APIResponse.success(
                data=cached_data,
                message=CORE_SUCCESS["upload_settings_retrieved"]
            )
        
        settings_data = {
            'MEDIA_IMAGE_SIZE_LIMIT': settings.MEDIA_FILE_SIZE_LIMITS.get('image'),
            'MEDIA_VIDEO_SIZE_LIMIT': settings.MEDIA_FILE_SIZE_LIMITS.get('video'),
            'MEDIA_AUDIO_SIZE_LIMIT': settings.MEDIA_FILE_SIZE_LIMITS.get('audio'),
            'MEDIA_DOCUMENT_SIZE_LIMIT': settings.MEDIA_FILE_SIZE_LIMITS.get('pdf'),
            
            'MEDIA_ALLOWED_IMAGE_EXTENSIONS': settings.MEDIA_ALLOWED_EXTENSIONS.get('image', []),
            'MEDIA_ALLOWED_VIDEO_EXTENSIONS': settings.MEDIA_ALLOWED_EXTENSIONS.get('video', []),
            'MEDIA_ALLOWED_AUDIO_EXTENSIONS': settings.MEDIA_ALLOWED_EXTENSIONS.get('audio', []),
            'MEDIA_ALLOWED_PDF_EXTENSIONS': settings.MEDIA_ALLOWED_EXTENSIONS.get('pdf', []),
            
            'PORTFOLIO_MEDIA_UPLOAD_MAX': settings.PORTFOLIO_MEDIA_UPLOAD_MAX,
            'BLOG_MEDIA_UPLOAD_MAX': settings.BLOG_MEDIA_UPLOAD_MAX,
            'REAL_ESTATE_MEDIA_UPLOAD_MAX': settings.REAL_ESTATE_MEDIA_UPLOAD_MAX,
            
            'PORTFOLIO_EXPORT_PRINT_MAX_ITEMS': settings.PORTFOLIO_EXPORT_PRINT_MAX_ITEMS,
            'BLOG_EXPORT_PRINT_MAX_ITEMS': settings.BLOG_EXPORT_PRINT_MAX_ITEMS,
            'REAL_ESTATE_EXPORT_PRINT_MAX_ITEMS': settings.REAL_ESTATE_EXPORT_PRINT_MAX_ITEMS,
        }
        
        cache.set(self.CACHE_KEY, settings_data, self.CACHE_TIMEOUT)
        
        return APIResponse.success(
            data=settings_data,
            message=CORE_SUCCESS["upload_settings_retrieved"]
        )
