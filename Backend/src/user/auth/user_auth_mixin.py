from rest_framework.exceptions import AuthenticationFailed, PermissionDenied
from django.conf import settings
from django.core.cache import cache
from rest_framework_simplejwt.authentication import JWTAuthentication
from src.user.messages import AUTH_ERRORS
from src.user.models import User
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie
from django.middleware.csrf import get_token
from rest_framework import exceptions


@method_decorator(ensure_csrf_cookie, name='dispatch')
class UserAuthMixin:
    """
    Mixin برای User Views (JWT-based Authentication)
    
    ویژگی‌ها:
    - CSRF token management
    - JWT token validation
    - User status validation
    - Error handling
    """
    
    def dispatch(self, request, *args, **kwargs):
        try:
            get_token(request)
            
            response = super().dispatch(request, *args, **kwargs)
            
            return response
        except exceptions.APIException:
            raise
        except Exception as e:
            raise PermissionDenied(AUTH_ERRORS["auth_not_authorized"])
    
    def _check_token(self, request):
        """
        بررسی JWT token (فقط برای User)
        """
        if not request.user.is_authenticated:
            return
            
        auth_header = JWTAuthentication().get_header(request)
        if auth_header:
            raw_token = JWTAuthentication().get_raw_token(auth_header)
            if raw_token and cache.get(f"old_token_{raw_token.decode()}"):
                raise PermissionDenied(AUTH_ERRORS["auth_invalid_token"])
    
    def _check_user_status(self, request):
        """
        بررسی وضعیت کاربر (برای User)
        """
        try:
            user = User.objects.get(pk=request.user.pk)
            
            if not user.is_active:
                raise PermissionDenied(AUTH_ERRORS["auth_account_inactive"])
                
            request.user = user
            
        except User.DoesNotExist:
            raise AuthenticationFailed(AUTH_ERRORS["auth_user_not_found"])

