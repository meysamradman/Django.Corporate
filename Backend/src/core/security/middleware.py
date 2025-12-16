from django.utils.deprecation import MiddlewareMixin
from django.http import JsonResponse
from django.core.cache import cache
from django.conf import settings
from django.contrib.sessions.models import Session
from django.utils import timezone
from rest_framework import status
from src.user.messages.auth import AUTH_ERRORS
from src.core.security.captcha.messages.messages import CAPTCHA_ERRORS
import logging

logger = logging.getLogger(__name__)


class SecurityLoggingMiddleware(MiddlewareMixin):
    
    def process_request(self, request):
        pass
    
    def process_response(self, request, response):
        if (request.path.endswith('/admin/login/') and 
            request.method == 'POST' and 
            response.status_code == 401):
            ip = self.get_client_ip(request)
            self.track_failed_attempt(ip)
        
        return response
    
    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
    
    def track_failed_attempt(self, ip):
        cache_key = f"failed_attempts_{ip}"
        attempts = cache.get(cache_key, 0)
        cache.set(cache_key, attempts + 1, timeout=3600)
        
        if attempts >= 5:
            pass


class RateLimitMiddleware(MiddlewareMixin):
    
    def process_request(self, request):
        ip = self.get_client_ip(request)
        
        if request.path.endswith('/admin/login/') and request.method == 'POST':
            if self.is_rate_limited(ip, 'admin_login'):
                return JsonResponse(
                    {'error': AUTH_ERRORS.get('otp_request_limit', 'Too many login attempts. Please try again later.')},
                    status=status.HTTP_429_TOO_MANY_REQUESTS
                )
        
        if '/captcha/' in request.path:
            if self.is_rate_limited(ip, 'captcha'):
                return JsonResponse(
                    {'error': CAPTCHA_ERRORS.get('captcha_rate_limit', 'Too many CAPTCHA requests. Please try again later.')},
                    status=status.HTTP_429_TOO_MANY_REQUESTS
                )
    
    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
    
    def is_rate_limited(self, ip, operation_type):
        cache_key = f"rate_limit_{operation_type}_{ip}"
        requests = cache.get(cache_key, 0)
        
        limits = {
            'admin_login': 5,
            'captcha': 10,
        }
        
        limit = limits.get(operation_type, 10)
        
        if requests >= limit:
            return True
        
        cache.set(cache_key, requests + 1, timeout=60)
        return False


class CSRFExemptAdminMiddleware(MiddlewareMixin):
    
    def process_view(self, request, callback, callback_args, callback_kwargs):
        if not getattr(settings, 'CSRF_EXEMPT_ADMIN_VIEWS', False):
            return None
            
        if request.path.startswith('/api/admin/') and request.method in ('POST', 'PUT', 'PATCH', 'DELETE'):
            setattr(request, '_dont_enforce_csrf_checks', True)
            
        return None


class AdminSessionExpiryMiddleware(MiddlewareMixin):
    """
    ✅ جلوگیری از ساخت session جدید وقتی session منقضی شده
    - چک می‌کند که session منقضی شده یا نه
    - اگر منقضی شده، 401 response برمی‌گرداند
    """
    
    def process_request(self, request):
        # فقط برای admin API endpoints
        if not request.path.startswith('/api/admin/'):
            return None
        
        # ✅ Skip برای OPTIONS requests (CORS preflight)
        if request.method == 'OPTIONS':
            return None
        
        # ✅ Skip برای public endpoints که نباید session چک بشن
        public_endpoints = [
            '/api/admin/login/',
            '/api/admin/logout/',
            '/api/admin/auth/captcha/generate/',  # CAPTCHA عمومی است
        ]
        
        if request.path in public_endpoints:
            return None
        
        # بعد از SessionMiddleware، request.session موجود است
        if not hasattr(request, 'session'):
            return None
        
        session_key = request.session.session_key
        if not session_key:
            # هیچ session ای وجود ندارد - 401
            logger.warning('[SessionExpiry] ❌ No session key - returning 401')
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
            
            # ✅ اضافه کردن CORS headers به 401 response
            response['Access-Control-Allow-Origin'] = request.META.get('HTTP_ORIGIN', 'http://localhost:3000')
            response['Access-Control-Allow-Credentials'] = 'true'
            response['Access-Control-Allow-Methods'] = 'GET, POST, PUT, PATCH, DELETE, OPTIONS'
            response['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-CSRFToken'
            
            return response
        
        logger.info(f'[SessionExpiry] 🔍 Checking session: {session_key[:20]}...')
        
        # چک کن که آیا session منقضی شده
        try:
            session = Session.objects.get(session_key=session_key)
            expire_date = session.expire_date
            now = timezone.now()
            
            logger.info(f'[SessionExpiry] Session found - Expire: {expire_date}, Now: {now}')
            
            if expire_date < now:
                logger.warning(f'[SessionExpiry] ❌ Session expired! Expire: {expire_date}, Now: {now}')
                
                # پاک کردن session از database
                session.delete()
                
                # پاک کردن request.session
                request.session.flush()
                
                logger.info(f'[SessionExpiry] ✅ Session deleted from DB and flushed')
                
                # علامت‌گذاری برای پاک کردن cookie
                request._session_expired = True
                request._expired_session_key = session_key
                
                # ✅ برگرداندن 401 response
                logger.warning('[SessionExpiry] ❌ Returning 401 - session expired')
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
                
                # ✅ اضافه کردن CORS headers به 401 response
                response['Access-Control-Allow-Origin'] = request.META.get('HTTP_ORIGIN', 'http://localhost:3000')
                response['Access-Control-Allow-Credentials'] = 'true'
                response['Access-Control-Allow-Methods'] = 'GET, POST, PUT, PATCH, DELETE, OPTIONS'
                response['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-CSRFToken'
                
                return response
            else:
                logger.info(f'[SessionExpiry] ✅ Session valid, expires in {(expire_date - now).total_seconds():.0f} seconds')
        except Session.DoesNotExist:
            logger.warning(f'[SessionExpiry] ⚠️ Session not found in DB: {session_key[:20]}...')
            # Session وجود ندارد - احتمالاً قبلاً پاک شده
            request.session.flush()
            request._session_expired = True
            request._expired_session_key = session_key
            
            # ✅ برگرداندن 401 response
            logger.warning('[SessionExpiry] ❌ Returning 401 - session not found')
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
            
            # ✅ اضافه کردن CORS headers به 401 response
            response['Access-Control-Allow-Origin'] = request.META.get('HTTP_ORIGIN', 'http://localhost:3000')
            response['Access-Control-Allow-Credentials'] = 'true'
            response['Access-Control-Allow-Methods'] = 'GET, POST, PUT, PATCH, DELETE, OPTIONS'
            response['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-CSRFToken'
            
            return response
        except Exception as e:
            logger.error(f'[SessionExpiry] ❌ Error checking session: {str(e)}', exc_info=True)
        
        return None
    
    def process_response(self, request, response):
        # اگر session منقضی شده بود، cookie را پاک کن
        if hasattr(request, '_session_expired') and request._session_expired:
            session_key = getattr(request, '_expired_session_key', 'unknown')[:20]
            logger.warning(f'[SessionExpiry] 🗑️ Deleting expired session cookie: {session_key}...')
            
            # پاک کردن cookie با همه حالات ممکن
            response.set_cookie(
                'sessionid',
                '',
                max_age=0,
                expires='Thu, 01 Jan 1970 00:00:00 GMT',
                path='/',
                domain=None,
                samesite='Lax',
                httponly=True,
                secure=settings.SESSION_COOKIE_SECURE
            )
            
            # همچنین CSRF cookie را هم پاک کن
            response.set_cookie(
                'csrftoken',
                '',
                max_age=0,
                expires='Thu, 01 Jan 1970 00:00:00 GMT',
                path='/',
                domain=None,
                samesite='Lax',
                httponly=False,
                secure=settings.CSRF_COOKIE_SECURE
            )
            
            logger.info(f'[SessionExpiry] ✅ Cookies deleted in response')
        
        return response


class SecurityHeadersMiddleware(MiddlewareMixin):
    """
    اضافه کردن Security Headers به همه Response ها
    رفع مشکلات OWASP ZAP Scan
    """
    
    def process_response(self, request, response):
        # Anti-clickjacking (OWASP ZAP: Missing Anti-clickjacking Header)
        response['X-Frame-Options'] = 'DENY'
        
        # Content type sniffing prevention (OWASP ZAP: X-Content-Type-Options Missing)
        response['X-Content-Type-Options'] = 'nosniff'
        
        # XSS Protection
        response['X-XSS-Protection'] = '1; mode=block'
        
        # Referrer Policy
        response['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        
        # Permissions Policy
        response['Permissions-Policy'] = 'camera=(), microphone=(), geolocation=()'
        
        # CSP for API responses (Anti-clickjacking)
        if '/api/' in request.path:
            response['Content-Security-Policy'] = "frame-ancestors 'none'"
        
        # Remove Server header to prevent version leakage
        if 'Server' in response:
            del response['Server']
        
        return response