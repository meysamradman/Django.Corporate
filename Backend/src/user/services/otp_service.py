import redis
import requests
from django.conf import settings
from django.utils import timezone
from src.user.messages import AUTH_ERRORS
from src.user.utils import validate_identifier, validate_otp, generate_otp, get_otp_expiry_time
from src.user.models import User

class OTPService:

    def __init__(self):
        self.redis_client = redis.Redis(
            host=settings.REDIS_HOST,
            port=settings.REDIS_PORT,
            db=settings.REDIS_DB,
            decode_responses=True
        )

        self.otp_expiry = getattr(settings, 'OTP_EXPIRY_SECONDS', 120)
        self.max_requests = getattr(settings, 'OTP_MAX_REQUESTS', 10)
        self.request_window = getattr(settings, 'OTP_REQUEST_WINDOW', 3600)

    def _get_redis_keys(self, mobile):

        return {
            'otp': f"otp:{mobile}",
            'expiry': f"otp_expiry:{mobile}",
            'requests': f"otp_requests:{mobile}"
        }

    def _check_request_limit(self, mobile):

        keys = self._get_redis_keys(mobile)
        current_requests = int(self.redis_client.get(keys['requests']) or 0)
        
        if current_requests >= self.max_requests:
            raise Exception(AUTH_ERRORS["otp_request_limit"])
        
        return current_requests

    def _store_otp_data(self, mobile, otp, expiry_time):

        keys = self._get_redis_keys(mobile)

        self.redis_client.setex(keys['otp'], self.otp_expiry, otp)
        self.redis_client.setex(keys['expiry'], self.otp_expiry, expiry_time.timestamp())

        self.redis_client.incr(keys['requests'])
        self.redis_client.expire(keys['requests'], self.request_window)

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

        except Exception as e:
            raise Exception(str(e))

    def verify_otp(self, identifier, otp):

        try:
            email, mobile = validate_identifier(identifier)
            if not mobile:
                raise Exception(AUTH_ERRORS["auth_invalid_mobile"])

            keys = self._get_redis_keys(mobile)
            stored_otp = self.redis_client.get(keys['otp'])
            stored_expiry = self.redis_client.get(keys['expiry'])
            
            if not stored_otp or not stored_expiry:
                raise Exception(AUTH_ERRORS["otp_expired"])

            expiry_time = timezone.datetime.fromtimestamp(float(stored_expiry))

            validate_otp(otp, stored_otp, expiry_time)

            user = User.objects.filter(mobile=mobile).first()
            if not user:
                raise Exception(AUTH_ERRORS["user_not_found"])

            self.redis_client.delete(keys['otp'], keys['expiry'])
            
            return user

        except Exception as e:
            raise Exception(str(e)) 