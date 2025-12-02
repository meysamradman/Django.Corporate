import logging
from django.utils.deprecation import MiddlewareMixin
from django.http import JsonResponse
from django.core.cache import cache
from django.conf import settings
from rest_framework import status
import time

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
            logger.critical(f"Multiple failed login attempts from IP: {ip} (attempts: {attempts + 1})")


class RateLimitMiddleware(MiddlewareMixin):
    
    def process_request(self, request):
        ip = self.get_client_ip(request)
        
        if request.path.endswith('/admin/login/') and request.method == 'POST':
            if self.is_rate_limited(ip, 'admin_login'):
                return JsonResponse(
                    {'error': 'Too many login attempts. Please try again later.'},
                    status=status.HTTP_429_TOO_MANY_REQUESTS
                )
        
        if '/captcha/' in request.path:
            if self.is_rate_limited(ip, 'captcha'):
                return JsonResponse(
                    {'error': 'Too many CAPTCHA requests. Please try again later.'},
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