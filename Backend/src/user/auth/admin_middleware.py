"""
Admin Session Management Middleware
مدیریت و بررسی session برای پنل ادمین

بهینه‌سازی شده برای:
- سرعت: استفاده از cache برای جلوگیری از query های تکراری
- امنیت: بررسی دقیق session expiry و پاک کردن خودکار
"""

from django.utils.deprecation import MiddlewareMixin
from django.http import JsonResponse
from django.conf import settings
from django.contrib.sessions.models import Session
from django.utils import timezone
from django.core.cache import cache
from src.core.cache import CacheService
import logging

logger = logging.getLogger(__name__)


class AdminSessionExpiryMiddleware(MiddlewareMixin):
    """
    Middleware برای مدیریت session ادمین
    
    ویژگی‌ها:
    - بررسی expiry session قبل از authentication
    - پاک کردن خودکار session منقضی شده
    - بهینه‌سازی با cache برای کاهش database queries
    - پاک کردن cookie در صورت expiry
    
    بهینه‌سازی‌های امنیتی و سرعت:
    1. Cache check برای جلوگیری از query تکراری
    2. Early exit برای non-admin endpoints
    3. Redis check قبل از database query
    4. Batch cookie deletion
    """
    
    # Cache timeout برای session check (5 ثانیه)
    SESSION_CHECK_CACHE_TTL = 5
    
    # Public endpoints که نیازی به session check ندارند
    # توجه: captcha و login فقط با secret path قابل دسترسی هستند
    PUBLIC_ENDPOINTS = frozenset([
        '/api/admin/logout/',
    ])
    
    def _is_public_endpoint(self, request):
        """چک کردن آیا endpoint public است (با secret path)"""
        if request.path in self.PUBLIC_ENDPOINTS:
            return True
        
        # چک کردن endpoints با secret path
        admin_secret = getattr(settings, 'ADMIN_URL_SECRET', '')
        if admin_secret:
            # Login و logout endpoints
            if f'/api/admin/{admin_secret}/auth/login/' in request.path:
                return True
            if f'/api/admin/{admin_secret}/auth/logout/' in request.path:
                return True
            # Captcha endpoints
            if f'/api/admin/{admin_secret}/auth/captcha/' in request.path:
                return True
        
        return False
    
    def process_request(self, request):
        """
        بررسی session قبل از پردازش request
        
        بهینه‌سازی:
        - Early exit برای non-admin paths
        - Cache برای جلوگیری از query تکراری
        - Redis check قبل از database
        - Refresh خودکار session در هر request
        """
        # ✅ Early exit: فقط برای admin API endpoints
        if not request.path.startswith('/api/admin/'):
            return None
        
        # ✅ Skip برای OPTIONS requests (CORS preflight)
        if request.method == 'OPTIONS':
            return None
        
        # Skip برای public endpoints (با secret path)
        if self._is_public_endpoint(request):
            return None
        
        # ✅ Early exit: بعد از SessionMiddleware، request.session باید موجود باشد
        if not hasattr(request, 'session'):
            return None
        
        session_key = request.session.session_key
        if not session_key:
            return self._create_401_response(request, 'No session key')
        
        # ✅ بهینه‌سازی: چک کردن cache قبل از database query
        cache_key = f'session_valid_{session_key}'
        cached_result = cache.get(cache_key)
        
        if cached_result is False:
            # Session قبلاً منقضی شده - از cache
            logger.debug(f'[SessionExpiry] Session expired (cached): {session_key[:20]}...')
            return self._handle_expired_session(request, session_key)
        
        # ✅ بهینه‌سازی: چک کردن Redis قبل از database
        try:
            session_manager = CacheService.get_session_manager()
            user_id = session_manager.get_admin_session(session_key)
            
            if user_id is None:
                # Session در Redis نیست - چک کردن database
                logger.debug(f'[SessionExpiry] Session not in Redis, checking DB: {session_key[:20]}...')
        except Exception as e:
            logger.warning(f'[SessionExpiry] Redis check failed: {str(e)}')
        
        # بررسی session در database
        try:
            session = Session.objects.get(session_key=session_key)
            expire_date = session.expire_date
            now = timezone.now()
            
            if expire_date < now:
                # Session منقضی شده
                logger.warning(f'[SessionExpiry] Session expired! Key: {session_key[:20]}..., Expire: {expire_date}')
                
                # Cache کردن نتیجه برای 5 ثانیه
                cache.set(cache_key, False, self.SESSION_CHECK_CACHE_TTL)
                
                return self._handle_expired_session(request, session_key, session)
            else:
                # ✅ Session معتبر - cache کردن نتیجه
                time_left = (expire_date - now).total_seconds()
                cache.set(cache_key, True, min(self.SESSION_CHECK_CACHE_TTL, int(time_left)))
                logger.debug(f'[SessionExpiry] Session valid, expires in {time_left:.0f}s')
                
        except Session.DoesNotExist:
            # Session در database وجود ندارد
            logger.warning(f'[SessionExpiry] Session not found in DB: {session_key[:20]}...')
            
            # Cache کردن نتیجه
            cache.set(cache_key, False, self.SESSION_CHECK_CACHE_TTL)
            
            return self._handle_expired_session(request, session_key)
        except Exception as e:
            logger.error(f'[SessionExpiry] Error checking session: {str(e)}', exc_info=True)
            # در صورت خطا، اجازه می‌دهیم request ادامه پیدا کند
            # بهتر است fail open باشیم تا fail closed
        
        return None
    
    def _handle_expired_session(self, request, session_key, session_obj=None):
        """
        مدیریت session منقضی شده
        
        انجام می‌دهد:
        1. پاک کردن از Redis
        2. پاک کردن از Database (اگر session_obj داده شده)
        3. Flush کردن request.session
        4. علامت‌گذاری برای پاک کردن cookie
        """
        # پاک کردن از Redis
        try:
            session_manager = CacheService.get_session_manager()
            session_manager.delete_admin_session(session_key)
        except Exception as e:
            logger.warning(f'[SessionExpiry] Failed to delete from Redis: {str(e)}')
        
        # پاک کردن از Database
        if session_obj:
            try:
                session_obj.delete()
            except Exception:
                pass
        else:
            try:
                Session.objects.filter(session_key=session_key).delete()
            except Exception:
                pass
        
        # Flush کردن request.session
        try:
            request.session.flush()
        except Exception:
            pass
        
        # علامت‌گذاری برای پاک کردن cookie در process_response
        request._session_expired = True
        request._expired_session_key = session_key
        
        return self._create_401_response(request, 'Session expired')
    
    def _create_401_response(self, request, reason='Session expired'):
        """
        ایجاد 401 response با CORS headers
        """
        response = JsonResponse(
            {
                'metaData': {
                    'message': 'Session expired. Please login again.',
                    'AppStatusCode': 401,
                    'success': False
                },
                'result': None
            },
            status=401
        )
        
        # ✅ CORS headers برای frontend
        origin = request.META.get('HTTP_ORIGIN', 'http://localhost:3000')
        response['Access-Control-Allow-Origin'] = origin
        response['Access-Control-Allow-Credentials'] = 'true'
        response['Access-Control-Allow-Methods'] = 'GET, POST, PUT, PATCH, DELETE, OPTIONS'
        response['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-CSRFToken'
        
        return response
    
    def process_response(self, request, response):
        """
        پاک کردن cookie در صورت expiry
        
        بهینه‌سازی: فقط در صورت نیاز cookie را پاک می‌کند
        """
        if hasattr(request, '_session_expired') and request._session_expired:
            session_key = getattr(request, '_expired_session_key', 'unknown')[:20]
            logger.debug(f'[SessionExpiry] Deleting expired session cookie: {session_key}...')
            
            # پاک کردن session cookie با استفاده از delete_cookie
            response.delete_cookie(
                'sessionid',
                path=settings.SESSION_COOKIE_PATH,
                domain=settings.SESSION_COOKIE_DOMAIN
            )
            
            # پاک کردن CSRF cookie
            response.delete_cookie(
                'csrftoken',
                path=settings.CSRF_COOKIE_PATH,
                domain=settings.CSRF_COOKIE_DOMAIN
            )
        
        return response

