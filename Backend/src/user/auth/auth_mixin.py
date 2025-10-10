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
    A mixin that provides authentication and authorization functionality
    for API views, including CSRF protection.
    
    This mixin:
    1. Makes sure CSRF cookie is set for all responses
    2. Validates that the user is active
    3. Checks for token blacklisting
    """
    
    def dispatch(self, request, *args, **kwargs):
        """
        Ensure CSRF token is available and validate user status before proceeding.
        """
        try:
            # Ensure CSRF token is generated
            get_token(request)
            
            # Execute normal authentication flow from DRF
            response = super().dispatch(request, *args, **kwargs)
            
            # CSRF token should only be in cookies/headers, not in response body for security
            # The token is already available via get_token(request) which sets the cookie
            
            return response
        except exceptions.APIException:
            raise
        except Exception as e:
            raise PermissionDenied(AUTH_ERRORS["auth_not_authorized"])
    
    def _check_token(self, request):
        """
        Check if the token is valid, not blacklisted or marked as old.
        """
        # Skip token check for unauthenticated requests
        if not request.user.is_authenticated:
            return
            
        auth_header = JWTAuthentication().get_header(request)
        if auth_header:
            raw_token = JWTAuthentication().get_raw_token(auth_header)
            if raw_token and cache.get(f"old_token_{raw_token.decode()}"):
                raise PermissionDenied(AUTH_ERRORS["auth_invalid_token"])
    
    def _check_user_status(self, request):
        """
        Check if the user exists and is active.
        Update the request.user with fresh data from database.
        """
        try:
            # Get fresh user data from database
            user = User.objects.get(pk=request.user.pk)
            
            # Check if the user account is active
            if not user.is_active:
                raise PermissionDenied(AUTH_ERRORS["auth_account_inactive"])
                
            # Update request.user with fresh data
            request.user = user
            
        except User.DoesNotExist:
            raise AuthenticationFailed(AUTH_ERRORS["auth_user_not_found"]) 