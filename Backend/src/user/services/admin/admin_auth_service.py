from src.user.models import User
from src.user.messages import AUTH_ERRORS
from src.user.services.admin.admin_session_service import AdminSessionService
from src.user.services.otp_service import OTPService
from django.core.exceptions import ValidationError
from rest_framework.exceptions import AuthenticationFailed

class AdminAuthService:
    @staticmethod
    def authenticate_admin(mobile, password, otp_code=None, request=None):
        if not mobile:
            raise ValidationError(AUTH_ERRORS.get("auth_invalid_mobile"))

        if not password and not otp_code:
            raise ValidationError(AUTH_ERRORS.get("auth_validation_error"))
        
        try:
            admin = User.objects.get(
                mobile=mobile, 
                user_type='admin', 
                is_staff=True, 
                is_admin_active=True,
                is_active=True
            )
            
            if password:
                if not admin.check_password(password):
                    raise AuthenticationFailed(AUTH_ERRORS.get("auth_invalid_password"))
            else:
                try:
                    otp_user = OTPService().verify_otp(mobile, otp_code)
                except Exception as e:
                    raise AuthenticationFailed(str(e) or AUTH_ERRORS.get("otp_invalid"))

                if not otp_user or otp_user.id != admin.id:
                    return None, None
                
        except User.DoesNotExist:
            return None, None
        
        if admin and admin.is_active:
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