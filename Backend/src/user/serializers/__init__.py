"""
User serializer exports.
"""
# Relative imports are safe inside __init__.py
from .otp_serializer import SendOTPSerializer, VerifyOTPSerializer
from .admin.admin_login_serializer import AdminLoginSerializer
from .user.user_login_serializer import UserLoginSerializer
from .user.user_register_serializer import UserRegisterSerializer
from .admin.admin_register_serializer import AdminRegisterSerializer, AdminCreateRegularUserSerializer

__all__ = [
    'SendOTPSerializer',
    'VerifyOTPSerializer',
    'AdminLoginSerializer',
    'AdminRegisterSerializer',
    'AdminCreateRegularUserSerializer',
    'UserLoginSerializer',
    'UserRegisterSerializer'
]
