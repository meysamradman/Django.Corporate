from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView

from src.core.cache import CacheService
from src.core.responses.response import APIResponse
from src.settings.messages.messages import SETTINGS_ERRORS, SETTINGS_SUCCESS
from src.settings.serializers.public.general_settings_serializer import (
    PublicGeneralSettingsSerializer,
)
from src.settings.services.public.general_settings_service import (
    get_public_general_settings,
)
from src.settings.utils.cache_public import SettingsPublicCacheKeys
from src.settings.utils import cache_ttl


class PublicGeneralSettingsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        try:
            cache_key = SettingsPublicCacheKeys.general_settings()
            cached_data = CacheService.get(cache_key)

            if cached_data is None:
                settings = get_public_general_settings()
                serializer = PublicGeneralSettingsSerializer(settings)
                cached_data = serializer.data
                CacheService.set(cache_key, cached_data, cache_ttl.PUBLIC_GENERAL_SETTINGS_TTL)

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
