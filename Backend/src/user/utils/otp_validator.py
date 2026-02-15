from django.core.exceptions import ValidationError
from django.conf import settings
import random
import string
from datetime import datetime, timedelta

from src.user.messages import AUTH_ERRORS

OTP_LENGTH = int(getattr(settings, 'OTP_LENGTH', 4))

def get_otp_length():

    return OTP_LENGTH

def generate_otp(length=OTP_LENGTH):

    digits = string.digits
    return ''.join(random.choice(digits) for _ in range(length))

def validate_otp(otp, stored_otp=None, expiry_time=None):

    if not otp:
        raise ValidationError(AUTH_ERRORS["otp_invalid"])
    
    if not otp.isdigit() or len(otp) != OTP_LENGTH:
        raise ValidationError(AUTH_ERRORS["otp_invalid"])

    if stored_otp is not None and expiry_time is not None:
        if otp != stored_otp:
            raise ValidationError(AUTH_ERRORS["otp_invalid"])
        
        if datetime.now() > expiry_time:
            raise ValidationError(AUTH_ERRORS["otp_expired"])
    
    return True

def get_otp_expiry_time(minutes=5):
    return datetime.now() + timedelta(minutes=minutes) 