from rest_framework.exceptions import AuthenticationFailed, PermissionDenied
from django.conf import settings
from src.user.messages import AUTH_ERRORS
from src.user.models import User
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie
from django.middleware.csrf import get_token
from rest_framework import exceptions

@method_decorator(ensure_csrf_cookie, name='dispatch')
class AdminAuthMixin:

    def dispatch(self, request, *args, **kwargs):
        try:
            get_token(request)
            
            response = super().dispatch(request, *args, **kwargs)
            
            return response
        except exceptions.APIException:
            raise
        except Exception as e:
            raise PermissionDenied(AUTH_ERRORS["auth_not_authorized"])
    
    def _check_user_status(self, request):
        
        try:
            user = User.objects.get(pk=request.user.pk)
            
            if not user.is_active:
                raise PermissionDenied(AUTH_ERRORS["auth_account_inactive"])
            
            if not user.is_staff:
                raise PermissionDenied(AUTH_ERRORS["auth_not_authorized"])
                
            request.user = user
            
        except User.DoesNotExist:
            raise AuthenticationFailed(AUTH_ERRORS["auth_user_not_found"])

