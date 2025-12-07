from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from src.user.auth.admin_session_auth import CSRFExemptSessionAuthentication
from src.user.access_control import SimpleAdminPermission
from src.core.responses.response import APIResponse
from src.user.messages import AUTH_SUCCESS, AUTH_ERRORS
from src.user.services.admin.admin_auth_service import AdminAuthService


@method_decorator(csrf_exempt, name='dispatch')
class AdminLogoutView(APIView):
    authentication_classes = [CSRFExemptSessionAuthentication]
    permission_classes = [SimpleAdminPermission]

    @staticmethod
    def _delete_cookie_with_settings(response, cookie_type='SESSION'):
        if cookie_type == 'SESSION':
            cookie_name = getattr(settings, 'SESSION_COOKIE_NAME', 'sessionid')
            cookie_path = getattr(settings, 'SESSION_COOKIE_PATH', '/')
            cookie_domain = getattr(settings, 'SESSION_COOKIE_DOMAIN', None)
            cookie_samesite = getattr(settings, 'SESSION_COOKIE_SAMESITE', 'Lax')
            cookie_secure = getattr(settings, 'SESSION_COOKIE_SECURE', False)
        else:
            cookie_name = getattr(settings, 'CSRF_COOKIE_NAME', 'csrftoken')
            cookie_path = getattr(settings, 'CSRF_COOKIE_PATH', '/')
            cookie_domain = getattr(settings, 'CSRF_COOKIE_DOMAIN', None)
            cookie_samesite = getattr(settings, 'CSRF_COOKIE_SAMESITE', 'Lax')
            cookie_secure = getattr(settings, 'CSRF_COOKIE_SECURE', False)
        
        response.delete_cookie(
            cookie_name,
            path=cookie_path,
            domain=cookie_domain,
            samesite=cookie_samesite,
            secure=cookie_secure
        )
        return response

    def post(self, request):
        try:
            session_key = request.session.session_key
            
            if session_key:
                AdminAuthService.logout_admin(session_key)
            
            request.session.flush()
            
            response = APIResponse.success(
                message=AUTH_SUCCESS["auth_logged_out"]
            )
            
            self._delete_cookie_with_settings(response, 'SESSION')
            self._delete_cookie_with_settings(response, 'CSRF')
            
            return response
            
        except Exception as e:
            return APIResponse.error(message=AUTH_ERRORS["auth_logout_error"])