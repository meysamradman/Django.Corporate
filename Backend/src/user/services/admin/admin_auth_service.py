from src.user.models import User
from src.user.messages import AUTH_ERRORS
from src.user.services.admin.admin_session_service import AdminSessionService
from django.core.exceptions import ValidationError
from rest_framework.exceptions import AuthenticationFailed
import os


class AdminAuthService:
    @staticmethod
    def authenticate_admin(mobile, password, otp_code=None, request=None):
        if not mobile or not password:
            raise ValidationError(AUTH_ERRORS.get("auth_validation_error"))
        
        try:
            admin = User.objects.get(
                mobile=mobile, 
                user_type='admin', 
                is_staff=True, 
                is_admin_active=True,
                is_active=True
            )
            
            if not admin.check_password(password):
                return None, None
                
        except User.DoesNotExist:
            return None, None
        
        if admin and admin.is_active:
            if os.getenv('ADMIN_2FA_ENABLED', 'False').lower() == 'true':
                if not otp_code:
                    raise AuthenticationFailed(AUTH_ERRORS.get("auth_validation_error"))
                
                if not AdminAuthService.verify_otp(admin, otp_code):
                    raise AuthenticationFailed(AUTH_ERRORS.get("otp_invalid"))
            
            session_key = AdminSessionService.create_session(admin, request)
            
            return admin, session_key
        
        return None, None
    
    @staticmethod
    def verify_otp(admin, otp_code):
        return True
    
    @staticmethod
    def logout_admin(session_key):
        AdminSessionService.destroy_session(session_key)
        return True