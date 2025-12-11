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
from src.core.cache import CacheService


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
        else:
            cookie_name = getattr(settings, 'CSRF_COOKIE_NAME', 'csrftoken')
            cookie_path = getattr(settings, 'CSRF_COOKIE_PATH', '/')
            cookie_domain = getattr(settings, 'CSRF_COOKIE_DOMAIN', None)
        
        # Django 6.0 delete_cookie() only accepts: key, path, domain
        response.delete_cookie(
            cookie_name,
            path=cookie_path,
            domain=cookie_domain
        )
        return response

    def _cleanup_session_completely(self, session_key: str, user_id=None):
        """پاک کردن کامل session از همه جا"""
        cleanup_results = {
            'redis_session_deleted': False,
            'django_session_deleted': False,
            'permission_cache_cleared': False,
            'cache_count_cleared': 0
        }
        
        try:
            # 1. حذف از Redis Session Cache
            if session_key:
                session_manager = CacheService.get_session_manager()
                cleanup_results['redis_session_deleted'] = session_manager.delete_admin_session(session_key)
            
            # 2. حذف از Django Session Backend
            if session_key:
                try:
                    from django.contrib.sessions.models import Session
                    Session.objects.filter(session_key=session_key).delete()
                    cleanup_results['django_session_deleted'] = True
                except Exception as e:
                    print(f"Django session delete error: {e}")
            
            # 3. پاک کردن Permission Cache
            if user_id:
                try:
                    cleared_count = CacheService.clear_user_cache(user_id)
                    cleanup_results['cache_count_cleared'] = cleared_count
                    cleanup_results['permission_cache_cleared'] = True
                except Exception as e:
                    print(f"Permission cache clear error: {e}")
            
        except Exception as e:
            print(f"Cleanup error: {e}")
        
        return cleanup_results

    def post(self, request):
        session_key = None
        user_id = None
        
        try:
            # دریافت session key و user_id قبل از flush
            session_key = request.session.session_key
            user_id = getattr(request.user, 'id', None) if request.user.is_authenticated else None
            
            # 1. Delete session from backend (AdminAuthService)
            if session_key:
                AdminAuthService.logout_admin(session_key)
            
            # 2. Cleanup کامل
            cleanup_results = self._cleanup_session_completely(session_key, user_id)
            
            # 3. Flush Django session (آخرین مرحله)
            request.session.flush()
            
            # 4. آماده کردن Response
            response = APIResponse.success(
                message=AUTH_SUCCESS["auth_logged_out"],
                metaData={'cleanup_status': cleanup_results}
            )
            
            # 5. حذف Cookies
            self._delete_cookie_with_settings(response, 'SESSION')
            self._delete_cookie_with_settings(response, 'CSRF')
            
            # 6. اضافه کردن Cache-Control Headers (برای جلوگیری از cache)
            response['Cache-Control'] = 'no-cache, no-store, must-revalidate, private'
            response['Pragma'] = 'no-cache'
            response['Expires'] = '0'
            
            return response
            
        except Exception as e:
            print(f"Logout error: {e}")
            
            # حتی در صورت خطا، سعی کن session رو پاک کنی
            if session_key:
                try:
                    AdminAuthService.logout_admin(session_key)
                    self._cleanup_session_completely(session_key, user_id)
                except:
                    pass
            
            response = APIResponse.error(
                message=AUTH_ERRORS["auth_logout_error"]
            )
            
            # حذف Cookies در هر صورت
            self._delete_cookie_with_settings(response, 'SESSION')
            self._delete_cookie_with_settings(response, 'CSRF')
            
            # Cache-Control Headers حتی در خطا
            response['Cache-Control'] = 'no-cache, no-store, must-revalidate, private'
            response['Pragma'] = 'no-cache'
            response['Expires'] = '0'
            
            return response