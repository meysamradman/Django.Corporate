from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView

from src.core.responses.response import APIResponse
from src.settings.messages.messages import SETTINGS_ERRORS
from src.settings.serializers.public.branding_serializer import (
    PublicLogoSerializer,
    PublicSliderSerializer,
)
from src.settings.services.public.branding_service import (
    get_public_active_sliders,
    get_public_logo_settings,
)


class PublicLogoView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        try:
            settings = get_public_logo_settings()
            serializer = PublicLogoSerializer(settings)
            return APIResponse.success(
                message='لوگو با موفقیت دریافت شد',
                data=serializer.data,
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
            sliders = get_public_active_sliders()
            serializer = PublicSliderSerializer(sliders, many=True)
            return APIResponse.success(
                message='اسلایدرها با موفقیت دریافت شدند',
                data=serializer.data,
                status_code=status.HTTP_200_OK,
            )
        except Exception:
            return APIResponse.error(
                message=SETTINGS_ERRORS['settings_retrieve_failed'],
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
