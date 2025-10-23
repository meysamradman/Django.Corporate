"""
User Constants - پیام‌های مربوط به احراز هویت
"""
# ✅ Import نسبی - چون در __init__.py هستیم
from .messages import AUTH_SUCCESS, AUTH_ERRORS, ROLE_ERRORS, ROLE_SUCCESS

__all__ = [
    'AUTH_SUCCESS',
    'AUTH_ERRORS',
    'ROLE_ERRORS',
    'ROLE_SUCCESS'
]
