"""
Honeypot View برای گرفتن تلاش‌های هک
این view روی URLهای قدیمی ادمین قرار می‌گیره تا هکرها رو بگیره
"""
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework.views import APIView
from rest_framework.parsers import JSONParser
from src.core.responses.response import APIResponse
from src.core.security.ip_ban import IPBanService
from django.middleware.csrf import get_token
import logging
import time
import re

logger = logging.getLogger('security')

# ✅ Pattern های رایج بات‌های هک
SUSPICIOUS_USER_AGENTS = [
    'bot', 'crawler', 'spider', 'scraper', 'curl', 'wget', 
    'python-requests', 'nikto', 'sqlmap', 'nmap', 'masscan',
    'scanner', 'exploit', 'hack', 'attack'
]


@method_decorator(csrf_exempt, name='dispatch')
class FakeAdminLoginView(APIView):
    """
    Honeypot: URL فیک برای گرفتن هکرها
    این view روی URLهای قدیمی مثل /api/admin/login/ قرار می‌گیره
    """
    authentication_classes = []
    permission_classes = []
    throttle_classes = []  # بدون محدودیت برای گرفتن بیشتر هکرها!
    parser_classes = [JSONParser]
    
    def get(self, request):
        """GET request - فیک CSRF token"""
        ip = self._get_client_ip(request)
        
        # ✅ چک بن بودن
        if IPBanService.is_banned(ip):
            logger.error(f"🚫 Blocked banned IP (GET): {ip}")
            return APIResponse.error(
                message="دسترسی شما مسدود شده است",
                status_code=403
            )
        
        # ✅ شناسایی بات
        is_suspicious = self._is_suspicious(request)
        if is_suspicious:
            logger.error(f"🚨🚨 SUSPICIOUS BOT DETECTED (GET): {ip}")
        
        self._log_attempt(request, method='GET', is_suspicious=is_suspicious)
        csrf_token = get_token(request)
        
        # فیک response که فکر کنه داره کار میکنه
        return APIResponse.success(
            message="CSRF token retrieved",
            data={'csrf_token': csrf_token}
        )
    
    def post(self, request):
        """POST request - فیک login"""
        ip = self._get_client_ip(request)
        
        # ✅ چک بن بودن
        if IPBanService.is_banned(ip):
            logger.error(f"🚫 Blocked banned IP (POST): {ip}")
            return APIResponse.error(
                message="دسترسی شما مسدود شده است",
                status_code=403
            )
        
        # ✅ شناسایی بات
        is_suspicious = self._is_suspicious(request)
        if is_suspicious:
            logger.error(f"🚨🚨 SUSPICIOUS BOT ATTACK (POST): {ip}")
        
        # ✅ ثبت تلاش و چک کردن بن
        should_ban = IPBanService.record_attempt(ip)
        if should_ban:
            logger.error(f"🚫 IP banned after multiple attempts: {ip}")
        
        # لاگ کامل تلاش هک
        self._log_attempt(request, method='POST', data=request.data, is_suspicious=is_suspicious)
        
        # تاخیر مصنوعی برای واقعی‌تر شدن
        time.sleep(2)
        
        # فیک response که فکر کنه login انجام شده
        return APIResponse.error(
            message="نام کاربری یا رمز عبور اشتباه است",
            status_code=401
        )
    
    def _is_suspicious(self, request):
        """شناسایی User-Agent های مشکوک"""
        user_agent = request.META.get('HTTP_USER_AGENT', '').lower()
        
        for pattern in SUSPICIOUS_USER_AGENTS:
            if pattern in user_agent:
                return True
        
        return False
    
    def _log_attempt(self, request, method='GET', data=None, is_suspicious=False):
        """لاگ کردن تلاش هک"""
        ip = self._get_client_ip(request)
        user_agent = request.META.get('HTTP_USER_AGENT', 'Unknown')
        referer = request.META.get('HTTP_REFERER', 'Unknown')
        attempts = IPBanService.get_attempts(ip)
        
        # ✅ لاگ کامل‌تر
        log_data = {
            'ip': ip,
            'method': method,
            'path': request.path,
            'user_agent': user_agent,
            'referer': referer,
            'is_suspicious': is_suspicious,
            'attempts': attempts,
        }
        
        if data:
            log_data['data'] = data
        
        logger.warning(
            f"🚨 HONEYPOT TRIGGERED! {log_data}"
        )
    
    def _get_client_ip(self, request):
        """دریافت IP واقعی کاربر"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR', 'Unknown')

