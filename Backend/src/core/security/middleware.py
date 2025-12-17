from django.utils.deprecation import MiddlewareMixin
from django.http import JsonResponse
from django.core.cache import cache
from django.conf import settings
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


# AdminSessionExpiryMiddleware به user/middleware منتقل شد
# این middleware اکنون در src.user.middleware.admin_session_middleware قرار دارد
# برای بهینه‌سازی امنیت و سرعت بهینه‌سازی شده است


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