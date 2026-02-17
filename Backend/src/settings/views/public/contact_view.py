from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView

from src.core.cache import CacheService
from src.core.responses.response import APIResponse
from src.settings.messages.messages import SETTINGS_ERRORS
from src.settings.serializers.public.contact_serializer import PublicContactSettingsSerializer
from src.settings.services.public.contact_service import get_public_contact_payload
from src.settings.utils.cache_public import SettingsPublicCacheKeys
from src.settings.utils import cache_ttl


class PublicContactView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        try:
            cache_key = SettingsPublicCacheKeys.contact_payload()
            cached_data = CacheService.get(cache_key)

            if cached_data is None:
                payload = get_public_contact_payload()
                serializer = PublicContactSettingsSerializer(payload)
                cached_data = serializer.data
                CacheService.set(cache_key, cached_data, cache_ttl.PUBLIC_CONTACT_TTL)

            return APIResponse.success(
                message='اطلاعات تماس با موفقیت دریافت شد',
                data=cached_data,
                status_code=status.HTTP_200_OK,
            )
        except Exception:
            return APIResponse.error(
                message=SETTINGS_ERRORS['settings_retrieve_failed'],
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
