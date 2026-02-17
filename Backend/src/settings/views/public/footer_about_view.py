from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView

from src.core.responses.response import APIResponse
from src.core.cache import CacheService
from src.settings.messages.messages import SETTINGS_ERRORS, SETTINGS_SUCCESS
from src.settings.serializers.public.footer_about_serializer import PublicFooterAboutSerializer
from src.settings.services.public.footer_about_service import get_public_footer_about
from src.settings.utils.cache_public import SettingsPublicCacheKeys
from src.settings.utils import cache_ttl


class PublicFooterAboutView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        try:
            cached_data = CacheService.get(SettingsPublicCacheKeys.footer_about())
            if cached_data is None:
                about = get_public_footer_about()
                serializer = PublicFooterAboutSerializer(about)
                cached_data = serializer.data
                CacheService.set(SettingsPublicCacheKeys.footer_about(), cached_data, cache_ttl.PUBLIC_FOOTER_ABOUT_TTL)
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
