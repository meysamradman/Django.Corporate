from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView

from src.core.responses.response import APIResponse
from src.core.cache import CacheService
from src.settings.messages.messages import SETTINGS_ERRORS, SETTINGS_SUCCESS
from src.settings.serializers.public.footer_serializer import PublicFooterSectionSerializer
from src.settings.services.public.footer_service import get_public_footer_sections
from src.settings.utils.cache_public import SettingsPublicCacheKeys
from src.settings.utils import cache_ttl

class PublicFooterView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        try:
            cached_data = CacheService.get(SettingsPublicCacheKeys.footer())
            if cached_data is None:
                sections = list(get_public_footer_sections())
                serializer = PublicFooterSectionSerializer(
                    sections,
                    many=True,
                    context={'request': request},
                )
                cached_data = serializer.data
                CacheService.set(SettingsPublicCacheKeys.footer(), cached_data, cache_ttl.PUBLIC_FOOTER_TTL)

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
