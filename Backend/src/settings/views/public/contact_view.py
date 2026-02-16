from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView

from src.core.responses.response import APIResponse
from src.settings.messages.messages import SETTINGS_ERRORS
from src.settings.serializers.public.contact_serializer import PublicContactSettingsSerializer
from src.settings.services.public.contact_service import get_public_contact_payload


class PublicContactView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        try:
            payload = get_public_contact_payload()
            serializer = PublicContactSettingsSerializer(payload)
            return APIResponse.success(
                message='اطلاعات تماس با موفقیت دریافت شد',
                data=serializer.data,
                status_code=status.HTTP_200_OK,
            )
        except Exception:
            return APIResponse.error(
                message=SETTINGS_ERRORS['settings_retrieve_failed'],
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
