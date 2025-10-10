from django.contrib.auth import logout
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from src.core.responses import APIResponse
from src.user.messages import AUTH_SUCCESS, AUTH_ERRORS
from src.user.auth.admin_session_auth import CSRFExemptSessionAuthentication


class AdminLogoutView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [CSRFExemptSessionAuthentication]

    def post(self, request):
        try:
            logout(request)
            response = APIResponse.success(
                message=AUTH_SUCCESS["auth_logged_out"]
            )
            return response
        except Exception as e:
            return APIResponse.error(
                message=AUTH_ERRORS.get("auth_logout_error", "Logout failed."),
                status_code=500
            )