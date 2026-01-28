import re
from django.http import JsonResponse
from django.utils.deprecation import MiddlewareMixin
from django.core.cache import cache
from .services import is_feature_active
from .feature_config import get_url_mapping

EXEMPT_PATHS = [
    r'^/admin/',
    r'^/api/core/',
    r'^/api/auth/',
    r'^/api/user/',
    r'^/api/settings/',
    r'^/api/analytics/',
    r'^/api/schema/',
    r'^/static/',
    r'^/media/',
    r'^/silk/',
]

FEATURE_URL_MAPPING = get_url_mapping()

class FeatureFlagMiddleware(MiddlewareMixin):
    
    def process_request(self, request):
        path = request.path
        
        if self._is_exempt_path(path):
            return None
        
        feature_key = self._get_feature_key_from_path(path)
        
        if feature_key:
            is_active = is_feature_active(feature_key)
            if not is_active:
                return JsonResponse(
                    {
                        'detail': f'Feature "{feature_key}" is currently disabled.',
                        'error': 'feature_disabled',
                        'feature_key': feature_key
                    },
                    status=404
                )
        
        return None
    
    def _is_exempt_path(self, path: str) -> bool:
        for pattern in EXEMPT_PATHS:
            if re.match(pattern, path):
                return True
        return False
    
    def _get_feature_key_from_path(self, path: str) -> str | None:
        for pattern, feature_key in FEATURE_URL_MAPPING.items():
            if re.match(pattern, path, re.IGNORECASE):
                return feature_key
        return None
