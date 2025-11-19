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
        Authenticate an admin using mobile/password (and optional OTP).
        """
        if not mobile or not password:
            raise ValidationError(AUTH_ERRORS.get("auth_validation_error"))
        
        # Initial lookup by mobile number
        try:
            admin = User.objects.get(
                mobile=mobile, 
                user_type='admin', 
                is_staff=True, 
                is_admin_active=True,
                is_active=True
            )
            
            # Verify password
            if not admin.check_password(password):
                return None, None
                
        except User.DoesNotExist:
            return None, None
        
        if admin and admin.is_active:
            # Handle optional two-factor authentication
            if os.getenv('ADMIN_2FA_ENABLED', 'False').lower() == 'true':
                if not otp_code:
                    raise AuthenticationFailed(AUTH_ERRORS.get("auth_validation_error"))
                
                # Verify OTP code
                if not AdminAuthService.verify_otp(admin, otp_code):
                    raise AuthenticationFailed(AUTH_ERRORS.get("otp_invalid"))
            
            # Create admin session
            session_key = AdminSessionService.create_session(admin, request)
            
            return admin, session_key
        
        return None, None
    
    @staticmethod
    def verify_otp(admin, otp_code):
        """
        Verify OTP for admin 2FA (placeholder implementation).
        """
        # TODO: Integrate with dedicated OTP provider.
        return True
    
    @staticmethod
    def logout_admin(session_key):
        """
        Log out an admin and destroy the associated session.
        """
        AdminSessionService.destroy_session(session_key)
        return True