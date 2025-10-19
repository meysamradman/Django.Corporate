import os
from datetime import timedelta
from rest_framework.response import Response
from django.conf import settings
from config.django.base import AUTH_COOKIE_NAME, REFRESH_COOKIE_NAME


class BaseCookie:
    """Base cookie handler for JWT authentication"""

    @classmethod
    def set_auth_cookies(cls, response: Response, access_token: str, refresh_token: str, expiration_time=None):

        if expiration_time is None:
            expiration_time = cls.get_access_token_lifetime()
            
        refresh_expiration_time = cls.get_refresh_token_lifetime()

        access_max_age = int(expiration_time.total_seconds())
        refresh_max_age = int(refresh_expiration_time.total_seconds())

        http_only = settings.SIMPLE_JWT.get('AUTH_COOKIE_HTTP_ONLY', True)
        secure = settings.SIMPLE_JWT.get('AUTH_COOKIE_SECURE', not settings.DEBUG)
        samesite = cls.get_samesite_setting()

        response.set_cookie(
            key=AUTH_COOKIE_NAME,
            value=access_token,
            httponly=http_only,
            max_age=access_max_age,
            expires=None,
            samesite=samesite,
            secure=secure,
        )
        response.set_cookie(
            key=REFRESH_COOKIE_NAME,
            value=refresh_token,
            httponly=http_only,
            max_age=refresh_max_age,
            expires=None,
            samesite=samesite,
            secure=secure,
        )

        return response

    @staticmethod
    def clear_auth_cookies(response: Response):
        response.delete_cookie(AUTH_COOKIE_NAME)
        response.delete_cookie(REFRESH_COOKIE_NAME)
        return response
    
    @classmethod
    def get_access_token_lifetime(cls):
        raise NotImplementedError
        
    @classmethod
    def get_refresh_token_lifetime(cls):
        raise NotImplementedError
        
    @classmethod
    def get_samesite_setting(cls):
        raise NotImplementedError


class UserCookie(BaseCookie):
    """
    Cookie handler for users (website)
    JWT-based authentication with cookies
    """
    
    @classmethod
    def get_access_token_lifetime(cls):
        return getattr(settings, 'USER_ACCESS_TOKEN_LIFETIME', timedelta(days=int(os.getenv('USER_ACCESS_TOKEN_LIFETIME_DAYS', 1))))
    
    @classmethod
    def get_refresh_token_lifetime(cls):
        return getattr(settings, 'USER_REFRESH_TOKEN_LIFETIME', timedelta(days=int(os.getenv('USER_REFRESH_TOKEN_LIFETIME_DAYS', 15))))
    
    @classmethod
    def get_samesite_setting(cls):
        return settings.SIMPLE_JWT.get('AUTH_COOKIE_SAMESITE', 'Lax')


class AdminSessionCookie:
    """
    Cookie handler for admin panel sessions
    Session-based authentication with Redis
    """
    
    @staticmethod
    def set_session_cookie(response: Response, session_key: str):
        """Set admin session cookie"""
        response.set_cookie(
            key='admin_session_id',
            value=session_key,
            httponly=True,
            secure=not settings.DEBUG,
            samesite='Strict',
            max_age=int(os.getenv('ADMIN_SESSION_TIMEOUT_DAYS', 3)) * 24 * 60 * 60,  # 3 days default
        )
        return response
    
    @staticmethod
    def clear_session_cookie(response: Response):
        """Clear admin session cookie"""
        response.delete_cookie('admin_session_id')
        return response
