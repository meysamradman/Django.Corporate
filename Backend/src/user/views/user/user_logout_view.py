from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from src.core.responses import APIResponse
from src.user.messages import AUTH_SUCCESS, AUTH_ERRORS
from src.user.auth import UserJWTAuthentication
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.tokens import RefreshToken


class UserLogoutView(APIView):
    authentication_classes = [UserJWTAuthentication, JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            # دریافت refresh token از کوکی یا هدر
            refresh_token = request.COOKIES.get('refresh_token') or request.data.get('refresh_token')
            
            if refresh_token:
                # سیاه کردن refresh token
                token = RefreshToken(refresh_token)
                token.blacklist()
            
            # ایجاد پاسخ موفقیت‌آمیز
            response = APIResponse.success(
                message=AUTH_SUCCESS["auth_logged_out"]
            )
            
            # پاک کردن کوکی‌ها
            response.delete_cookie('access_token')
            response.delete_cookie('refresh_token')
            
            return response
            
        except Exception as e:
            return APIResponse.error(
                message=AUTH_ERRORS["auth_logout_error"],
                status_code=500
            )