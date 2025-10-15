from django.conf import settings
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

class UploadSettingsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        settings_data = {
            'MEDIA_IMAGE_SIZE_LIMIT': settings.MEDIA_FILE_SIZE_LIMITS.get('image'),
            'MEDIA_ALLOWED_IMAGE_EXTENSIONS': settings.MEDIA_ALLOWED_EXTENSIONS.get('image', []),
        }
        # Now the renderer will automatically format this response
        return Response(settings_data)