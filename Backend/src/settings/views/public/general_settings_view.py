from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView

from src.core.responses.response import APIResponse
from src.settings.messages.messages import SETTINGS_ERRORS, SETTINGS_SUCCESS
from src.settings.serializers.public.general_settings_serializer import (
    PublicGeneralSettingsSerializer,
)
from src.settings.services.public.general_settings_service import (
    get_public_general_settings,
)


class PublicGeneralSettingsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        try:
            settings = get_public_general_settings()
            serializer = PublicGeneralSettingsSerializer(settings)
            return APIResponse.success(
                message=SETTINGS_SUCCESS['settings_retrieved'],
                data=serializer.data,
                status_code=status.HTTP_200_OK,
            )
        except Exception:
            return APIResponse.error(
                message=SETTINGS_ERRORS['settings_retrieve_failed'],
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
