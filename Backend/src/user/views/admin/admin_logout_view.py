from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from src.user.auth.admin_session_auth import CSRFExemptSessionAuthentication
from src.core.responses import APIResponse
from src.user.messages import AUTH_SUCCESS, AUTH_ERRORS
from src.user.services.admin.admin_auth_service import AdminAuthService


@method_decorator(csrf_exempt, name='dispatch')
class AdminLogoutView(APIView):
    authentication_classes = [CSRFExemptSessionAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """خروج ادمین"""
        try:
            # دریافت session key از کوکی Django
            session_key = request.session.session_key
            
            if session_key:
                # پاک کردن session
                AdminAuthService.logout_admin(session_key)
            
            # ایجاد پاسخ موفقیت‌آمیز
            response = APIResponse.success(
                message=AUTH_SUCCESS["auth_logged_out"]
            )
            
            # پاک کردن کوکی session (Django خودکار انجام می‌دهد)
            # response.delete_cookie('sessionid')  # Django handles this automatically
            
            return response
            
        except Exception as e:
            return APIResponse.error(message=AUTH_ERRORS["auth_logout_error"])