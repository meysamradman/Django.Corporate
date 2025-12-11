import requests
from django.conf import settings
from django.utils import timezone
from src.user.messages import AUTH_ERRORS
from src.user.utils import validate_identifier, validate_otp, generate_otp, get_otp_expiry_time
from src.user.models import User
from src.user.utils.jwt_tokens import generate_jwt_tokens
from src.core.cache import CacheService

class OTPService:

    def __init__(self):
        self.otp_expiry = getattr(settings, 'OTP_EXPIRY_SECONDS', 120)
        self.max_requests = getattr(settings, 'OTP_MAX_REQUESTS', 10)
        self.request_window = getattr(settings, 'OTP_REQUEST_WINDOW', 3600)

    def _get_request_key(self, mobile):
        return f"otp_requests:{mobile}"
    
    def _get_expiry_key(self, mobile):
        return f"otp_expiry:{mobile}"

    def _check_request_limit(self, mobile):
        request_key = self._get_request_key(mobile)
        current_requests = int(CacheService.get(request_key) or 0)
        
        if current_requests >= self.max_requests:
            raise Exception(AUTH_ERRORS["otp_request_limit"])
        
        return current_requests

    def _store_otp_data(self, mobile, otp, expiry_time):
        CacheService.set_otp(mobile, otp, self.otp_expiry)
        
        expiry_key = self._get_expiry_key(mobile)
        CacheService.set(expiry_key, expiry_time.timestamp(), self.otp_expiry)
        
        request_key = self._get_request_key(mobile)
        current = int(CacheService.get(request_key) or 0)
        CacheService.set(request_key, current + 1, self.request_window)

    def _send_sms(self, mobile, otp):
        sms_data = {
            'bodyId': settings.MELIPAYAMAK_BODY_ID,
            'to': mobile,
            'args': [otp]
        }
        
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {settings.MELIPAYAMAK_API_KEY}'
        }
        
        response = requests.post(
            settings.MELIPAYAMAK_API_URL,
            json=sms_data,
            headers=headers
        )
        
        if response.status_code != 200:
            raise Exception(AUTH_ERRORS["otp_send_failed"])

    def send_otp(self, identifier):
        try:
            email, mobile = validate_identifier(identifier)
            if not mobile:
                raise Exception(AUTH_ERRORS["auth_invalid_mobile"])

            self._check_request_limit(mobile)

            otp = generate_otp()
            expiry_time = get_otp_expiry_time(minutes=2)
            self._store_otp_data(mobile, otp, expiry_time)

            self._send_sms(mobile, otp)
            return True

        except Exception:
            raise Exception(AUTH_ERRORS["otp_send_failed"])

    def verify_otp(self, identifier, otp):
        try:
            email, mobile = validate_identifier(identifier)
            if not mobile:
                raise Exception(AUTH_ERRORS["auth_invalid_mobile"])

            stored_otp = CacheService.get_otp(mobile)
            
            expiry_key = self._get_expiry_key(mobile)
            stored_expiry = CacheService.get(expiry_key)
            
            if not stored_otp or not stored_expiry:
                raise Exception(AUTH_ERRORS["otp_expired"])

            expiry_time = timezone.datetime.fromtimestamp(float(stored_expiry))

            validate_otp(otp, stored_otp, expiry_time)

            user = User.objects.filter(mobile=mobile).first()
            if not user:
                raise Exception(AUTH_ERRORS["user_not_found"])

            CacheService.delete_otp(mobile)
            CacheService.delete(expiry_key)
            
            return user

        except Exception:
            raise Exception(AUTH_ERRORS["otp_verification_failed"])
            
    def get_tokens(self, user):
        return generate_jwt_tokens(user)
