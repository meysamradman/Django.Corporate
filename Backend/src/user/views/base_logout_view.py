from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from src.core.responses import APIResponse
from src.user.messages import AUTH_ERRORS


class BaseLogoutView(APIView):
    permission_classes = [IsAuthenticated]
    service_class = None
    serializer_class = None

    def post(self, request):
        serializer = self.serializer_class(data=request.data, context={'request': request})
        if serializer.is_valid():
            refresh_token = serializer.validated_data.get('refresh_token') or request.COOKIES.get('refresh_token')
            return self.service_class.logout(request.user, refresh_token)

        return APIResponse.error(
            message=str(next(iter(serializer.errors.values()))[0]) if serializer.errors else AUTH_ERRORS["auth_validation_error"],
            errors=serializer.errors
        ) 