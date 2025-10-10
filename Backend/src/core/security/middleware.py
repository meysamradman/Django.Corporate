"""
Security Middleware for Enhanced Monitoring
Based on Permission_System.mdc specifications
"""
import logging
from django.utils.deprecation import MiddlewareMixin
from django.http import JsonResponse
from django.core.cache import cache
from rest_framework import status
import time

logger = logging.getLogger(__name__)


class SecurityLoggingMiddleware(MiddlewareMixin):
    """
    Middleware for logging security-related events
    """
    
    def process_request(self, request):
        """Log suspicious requests"""
        # Log admin login attempts
        if request.path.endswith('/admin/login/') and request.method == 'POST':
            ip = self.get_client_ip(request)
            logger.info(f"Admin login attempt from IP: {ip}")
            
        # Log CAPTCHA requests
        if '/captcha/' in request.path:
            ip = self.get_client_ip(request)
            logger.info(f"CAPTCHA request from IP: {ip} to {request.path}")
    
    def process_response(self, request, response):
        """Log security-related responses"""
        # Log failed admin login attempts
        if (request.path.endswith('/admin/login/') and 
            request.method == 'POST' and 
            response.status_code == 401):
            ip = self.get_client_ip(request)
            logger.warning(f"Failed admin login attempt from IP: {ip}")
            
            # Track failed attempts
            self.track_failed_attempt(ip)
        
        # Log throttled requests
        if response.status_code == 429:
            ip = self.get_client_ip(request)
            logger.warning(f"Request throttled for IP: {ip} to {request.path}")
        
        return response
    
    def get_client_ip(self, request):
        """Get client IP address"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
    
    def track_failed_attempt(self, ip):
        """Track failed login attempts per IP"""
        cache_key = f"failed_attempts_{ip}"
        attempts = cache.get(cache_key, 0)
        cache.set(cache_key, attempts + 1, timeout=3600)  # 1 hour
        
        # Log if too many failed attempts
        if attempts >= 5:
            logger.critical(f"Multiple failed login attempts from IP: {ip} (attempts: {attempts + 1})")


class RateLimitMiddleware(MiddlewareMixin):
    """
    Additional rate limiting middleware for extra security
    """
    
    def process_request(self, request):
        """Check for rate limiting before processing request"""
        ip = self.get_client_ip(request)
        
        # Check for admin login rate limiting
        if request.path.endswith('/admin/login/') and request.method == 'POST':
            if self.is_rate_limited(ip, 'admin_login'):
                return JsonResponse(
                    {'error': 'Too many login attempts. Please try again later.'},
                    status=status.HTTP_429_TOO_MANY_REQUESTS
                )
        
        # Check for CAPTCHA rate limiting
        if '/captcha/' in request.path:
            if self.is_rate_limited(ip, 'captcha'):
                return JsonResponse(
                    {'error': 'Too many CAPTCHA requests. Please try again later.'},
                    status=status.HTTP_429_TOO_MANY_REQUESTS
                )
    
    def get_client_ip(self, request):
        """Get client IP address"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
    
    def is_rate_limited(self, ip, operation_type):
        """Check if IP is rate limited for specific operation"""
        cache_key = f"rate_limit_{operation_type}_{ip}"
        requests = cache.get(cache_key, 0)
        
        # Define rate limits
        limits = {
            'admin_login': 5,  # 5 attempts per minute
            'captcha': 10,     # 10 requests per minute
        }
        
        limit = limits.get(operation_type, 10)
        
        if requests >= limit:
            return True
        
        # Increment counter
        cache.set(cache_key, requests + 1, timeout=60)  # 1 minute
        return False
