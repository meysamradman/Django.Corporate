from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView

from src.core.cache import CacheService
from src.core.responses.response import APIResponse
from src.settings.messages.messages import SETTINGS_ERRORS, SETTINGS_SUCCESS
from src.settings.serializers.public.branding_serializer import (
    PublicLogoSerializer,
    PublicSliderSerializer,
)
from src.settings.services.public.branding_service import (
    get_public_active_sliders,
    get_public_logo_settings,
)
from src.settings.utils.cache_public import SettingsPublicCacheKeys
from src.settings.utils import cache_ttl

class PublicLogoView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        try:
            cache_key = SettingsPublicCacheKeys.branding_logo()
            cached_data = CacheService.get(cache_key)

            if cached_data is None:
                settings = get_public_logo_settings()
                serializer = PublicLogoSerializer(settings)
                cached_data = serializer.data
                CacheService.set(cache_key, cached_data, cache_ttl.PUBLIC_BRANDING_LOGO_TTL)

            return APIResponse.success(
                message=SETTINGS_SUCCESS['settings_retrieved'],
                data=cached_data,
                status_code=status.HTTP_200_OK,
            )
        except Exception:
            return APIResponse.error(
                message=SETTINGS_ERRORS['settings_retrieve_failed'],
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

class PublicSliderListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        try:
            cache_key = SettingsPublicCacheKeys.branding_sliders()
            cached_data = CacheService.get(cache_key)

            if cached_data is None:
                sliders = get_public_active_sliders()
                serializer = PublicSliderSerializer(sliders, many=True)
                cached_data = serializer.data
                CacheService.set(cache_key, cached_data, cache_ttl.PUBLIC_BRANDING_SLIDERS_TTL)

            return APIResponse.success(
                message=SETTINGS_SUCCESS['settings_retrieved'],
                data=cached_data,
                status_code=status.HTTP_200_OK,
            )
        except Exception:
            return APIResponse.error(
                message=SETTINGS_ERRORS['settings_retrieve_failed'],
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
