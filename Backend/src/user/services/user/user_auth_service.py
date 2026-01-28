from src.user.models import User
from src.user.messages import AUTH_ERRORS
from src.user.utils.jwt_tokens import generate_jwt_tokens
from django.core.exceptions import ValidationError
from rest_framework.exceptions import AuthenticationFailed

class UserAuthService:
    @staticmethod
    def authenticate_user(identifier, password=None, otp=None, login_type='password', user_type='user'):
        if not identifier:
            raise ValidationError(AUTH_ERRORS.get("auth_identifier_cannot_empty"))
        
        if login_type == 'password':
            if not password:
                raise ValidationError(AUTH_ERRORS.get("auth_password_empty"))
            
            try:
                if '@' in identifier:
                    user = User.objects.get(email=identifier, user_type=user_type)
                else:
                    user = User.objects.get(mobile=identifier, user_type=user_type)
                
                if not user.check_password(password):
                    raise AuthenticationFailed(AUTH_ERRORS["auth_invalid_credentials"])
                    
            except User.DoesNotExist:
                raise AuthenticationFailed(AUTH_ERRORS["auth_invalid_credentials"])
        elif login_type == 'otp':
            if not otp:
                raise ValidationError(AUTH_ERRORS.get("auth_validation_error"))
            
            if UserAuthService.verify_otp(identifier, otp):
                try:
                    if '@' in identifier:
                        user = User.objects.get(email=identifier, user_type=user_type)
                    else:
                        user = User.objects.get(mobile=identifier, user_type=user_type)
                except User.DoesNotExist:
                    raise AuthenticationFailed(AUTH_ERRORS["auth_invalid_credentials"])
            else:
                raise AuthenticationFailed(AUTH_ERRORS["auth_invalid_otp"])
        else:
            raise ValidationError(AUTH_ERRORS.get("auth_invalid_type"))
        
        if user and user.is_active and user.user_type == user_type:
            return user
        
        raise AuthenticationFailed(AUTH_ERRORS["auth_invalid_credentials"])
    
    @staticmethod
    def verify_otp(identifier, otp_code):
        return True
    
    @staticmethod
    def get_tokens(user):
        return generate_jwt_tokens(user)