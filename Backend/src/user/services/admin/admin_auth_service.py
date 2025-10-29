from src.user.models import User
from src.user.messages import AUTH_ERRORS
from src.user.auth.admin_session_auth import AdminSessionService
from django.core.exceptions import ValidationError
from rest_framework.exceptions import AuthenticationFailed
import os


class AdminAuthService:
    @staticmethod
    def authenticate_admin(mobile, password, otp_code=None, request=None):
        """
        احراز هویت ادمین با mobile و password
        """
        if not mobile or not password:
            raise ValidationError(AUTH_ERRORS.get("auth_validation_error"))
        
        # احراز هویت اولیه با mobile - جستجو در دیتابیس
        try:
            admin = User.objects.get(
                mobile=mobile, 
                user_type='admin', 
                is_staff=True, 
                is_admin_active=True,
                is_active=True
            )
            
            # بررسی پسورد
            if not admin.check_password(password):
                return None, None
                
        except User.DoesNotExist:
            return None, None
        
        if admin and admin.is_active:
            # بررسی دو مرحله‌ای (اگر فعال باشد)
            if os.getenv('ADMIN_2FA_ENABLED', 'False').lower() == 'true':
                if not otp_code:
                    raise AuthenticationFailed(AUTH_ERRORS.get("auth_validation_error"))
                
                # بررسی کد OTP
                if not AdminAuthService.verify_otp(admin, otp_code):
                    raise AuthenticationFailed(AUTH_ERRORS.get("otp_invalid"))
            
            # ایجاد session
            session_key = AdminSessionService.create_session(admin, request)
            
            return admin, session_key
        
        return None, None
    
    @staticmethod
    def verify_otp(admin, otp_code):
        """
        بررسی کد OTP برای ادمین
        """
        # اینجا باید منطق بررسی OTP پیاده شود
        # برای مثال با استفاده از یک سرویس OTP خارجی
        return True  # موقت برای تست
    
    @staticmethod
    def logout_admin(session_key):
        """
        خروج ادمین و پاک کردن session
        """
        AdminSessionService.destroy_session(session_key)
        return True