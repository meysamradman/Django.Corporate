from rest_framework.exceptions import AuthenticationFailed
from src.user.messages import AUTH_ERRORS
from src.user.services.otp_service import OTPService
from src.user.utils import validate_identifier, validate_otp, generate_jwt_tokens
from src.user.models import User


class BaseLoginService:
    @classmethod
    def get_user_filters(cls, user_type='user'):
        if user_type == 'admin':
            return {"is_staff": True, "user_type": "admin", "is_admin_active": True}
        return {"is_staff": False, "user_type": "user"}
    
    @classmethod
    def get_user_by_identifier(cls, identifier, user_type='user'):
        filters = cls.get_user_filters(user_type)
        
        try:
            email, mobile = validate_identifier(identifier)
        except ValueError as e:
            raise AuthenticationFailed(str(e))

        if email:
            filters["email"] = email
        if mobile:
            filters["mobile"] = mobile

        required_fields = ["id", "password", "is_active", "is_staff", "is_superuser", "mobile", "email"]
        return User.objects.filter(**filters).only(*required_fields).first()

    @classmethod
    def authenticate_user(cls, identifier, password=None, otp=None, login_type='password', user_type='user'):
        user = cls.get_user_by_identifier(identifier, user_type)

        if not user:
            raise AuthenticationFailed(AUTH_ERRORS["not_found"])

        if not user.is_active:
            raise AuthenticationFailed(AUTH_ERRORS["auth_account_inactive"])

        if login_type == 'password':
            if not user.check_password(password):
                raise AuthenticationFailed(AUTH_ERRORS["auth_invalid_password"])
        else:
            try:
                validate_otp(otp, None, None)
                otp_service = OTPService()
                verified_user = otp_service.verify_otp(identifier, otp)
                user_filters = cls.get_user_filters(user_type)
                for key, value in user_filters.items():
                    if getattr(verified_user, key) != value:
                        raise AuthenticationFailed(AUTH_ERRORS["auth_invalid_credentials"])
            except Exception as e:
                raise AuthenticationFailed(str(e))

        return user

    @staticmethod
    def get_tokens(user):
        return generate_jwt_tokens(user)
