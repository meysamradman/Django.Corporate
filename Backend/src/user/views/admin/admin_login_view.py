from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie, csrf_exempt
from rest_framework.views import APIView
from rest_framework.parsers import JSONParser
from src.user.auth.admin_session_auth import CSRFExemptSessionAuthentication
from src.core.responses import APIResponse
from src.user.serializers.admin.admin_login_serializer import AdminLoginSerializer
from src.user.services.admin.admin_auth_service import AdminAuthService
from src.user.messages import AUTH_ERRORS, AUTH_SUCCESS
from src.user.models import User
from django.middleware.csrf import get_token
from src.core.security.captcha.services import CaptchaService
from src.core.security.captcha.messages import CAPTCHA_ERRORS
from src.core.security.throttling import AdminLoginThrottle
import os


@method_decorator(csrf_exempt, name='dispatch')
class AdminLoginView(APIView):
    authentication_classes = [CSRFExemptSessionAuthentication]
    permission_classes = []
    throttle_classes = [AdminLoginThrottle]  # اضافه کردن throttling برای امنیت بیشتر
    parser_classes = [JSONParser]

    def get(self, request):
        """دریافت CSRF token برای فرم ورود"""
        csrf_token = get_token(request)
        return APIResponse.success(
            message="CSRF token generated successfully",
            data={'csrf_token': csrf_token}
        )

    def post(self, request):
        """ورود ادمین"""
        serializer = AdminLoginSerializer(data=request.data)
        
        if not serializer.is_valid():
            return APIResponse.error(
                message=AUTH_ERRORS["auth_validation_error"],
                errors=serializer.errors
            )
            
        try:
            mobile = serializer.validated_data.get('mobile')
            password = serializer.validated_data.get('password')
            captcha_id = serializer.validated_data.get('captcha_id')
            captcha_answer = serializer.validated_data.get('captcha_answer')
            otp_code = serializer.validated_data.get('otp_code')
            
            # Validate CAPTCHA - فعال کردن کپتچا برای امنیت بیشتر
            if not CaptchaService.verify_captcha(captcha_id, captcha_answer):
                return APIResponse.error(
                    message=CAPTCHA_ERRORS.get("captcha_invalid"),
                    status_code=400
                )
            
            admin, session_key = AdminAuthService.authenticate_admin(
                mobile=mobile,
                password=password,
                otp_code=otp_code,
                request=request
            )
            
            if admin:
                # تنظیم کوکی session
                response = APIResponse.success(
                    message=AUTH_SUCCESS["auth_logged_in"],
                    data={
                        'user_id': admin.id,
                        'is_superuser': admin.is_superuser
                    }
                )
                
                # تنظیم CSRF token فقط بعد از موفقیت‌آمیز بودن authentication
                csrf_token = get_token(request)
                response.set_cookie(
                    'csrftoken',
                    csrf_token,
                    max_age=3600,  # 1 hour
                    httponly=False,  # Frontend needs to read this
                    samesite='Strict',
                    secure=not os.getenv('DEBUG', 'True').lower() == 'true'
                )
                
                # Debug: Check if session was created properly
                print(f"DEBUG: Session created: {session_key}")
                print(f"DEBUG: Session data: {request.session.get('_auth_user_id')}")
                print(f"DEBUG: Session exists: {request.session.exists(session_key)}")
                
                return response
            else:
                return APIResponse.error(
                    message=AUTH_ERRORS["auth_invalid_credentials"],
                    status_code=401
                )
        except Exception as e:
            return APIResponse.error(message=AUTH_ERRORS["auth_invalid_credentials"])