import secrets
from django.conf import settings
from django.core.exceptions import ValidationError
from rest_framework.exceptions import AuthenticationFailed

from src.core.cache import CacheService
from src.user.messages import AUTH_ERRORS
from src.user.models import User
from src.user.services.admin.admin_session_service import AdminSessionService
from src.user.services.otp_service import OTPService

class AdminPasswordResetService:
    TOKEN_TTL_SECONDS = getattr(settings, 'ADMIN_PASSWORD_RESET_TOKEN_TTL', 600)
    CAPTCHA_VERIFIED_TTL_SECONDS = getattr(settings, 'ADMIN_PASSWORD_RESET_CAPTCHA_VERIFIED_TTL', 600)

    @staticmethod
    def _token_key(mobile: str) -> str:
        return f"admin_password_reset_token:{mobile}"

    @staticmethod
    def _captcha_verified_key(mobile: str) -> str:
        return f"admin_password_reset_captcha_verified:{mobile}"

    @staticmethod
    def _get_admin_by_mobile(mobile: str):
        return User.objects.filter(
            mobile=mobile,
            user_type='admin',
            is_staff=True,
            is_admin_active=True,
            is_active=True
        ).first()

    @classmethod
    def request_reset_otp(cls, mobile: str) -> bool:
        admin = cls._get_admin_by_mobile(mobile)
        if not admin:
            return False

        OTPService().send_otp(mobile)
        return True

    @classmethod
    def has_verified_captcha(cls, mobile: str) -> bool:
        return bool(CacheService.get(cls._captcha_verified_key(mobile)))

    @classmethod
    def mark_captcha_verified(cls, mobile: str):
        CacheService.set(cls._captcha_verified_key(mobile), '1', cls.CAPTCHA_VERIFIED_TTL_SECONDS)

    @classmethod
    def verify_reset_otp(cls, mobile: str, otp_code: str) -> str:
        try:
            otp_user = OTPService().verify_otp(mobile, otp_code)
        except Exception as e:
            raise ValidationError(str(e) or AUTH_ERRORS.get("otp_invalid"))

        admin = cls._get_admin_by_mobile(mobile)
        if not admin or not otp_user or otp_user.id != admin.id:
            raise AuthenticationFailed(AUTH_ERRORS.get("admin_active_required"))

        reset_token = secrets.token_urlsafe(32)
        CacheService.set(cls._token_key(mobile), reset_token, cls.TOKEN_TTL_SECONDS)
        return reset_token

    @classmethod
    def confirm_password_reset(cls, mobile: str, reset_token: str, new_password: str):
        stored_token = CacheService.get(cls._token_key(mobile))
        if not stored_token or stored_token != reset_token:
            raise ValidationError(AUTH_ERRORS.get("auth_invalid_token"))

        admin = cls._get_admin_by_mobile(mobile)
        if not admin:
            raise AuthenticationFailed(AUTH_ERRORS.get("admin_active_required"))

        admin.set_password(new_password)
        admin.save(update_fields=['password'])

        CacheService.delete(cls._token_key(mobile))
        CacheService.delete(cls._captcha_verified_key(mobile))
        AdminSessionService.destroy_user_sessions(admin.id)

        return admin
