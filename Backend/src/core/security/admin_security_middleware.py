from django.http import JsonResponse
from django.conf import settings
from src.core.security.ip_ban import IPBanService
import logging

logger = logging.getLogger('admin_security')


class AdminSecurityMiddleware:
    """
    امنیت چندلایه برای پنل ادمین
    - چک کردن HTTPS در production
    - IP Whitelist (اختیاری)
    - لاگ کردن تمام دسترسی‌ها
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        admin_secret = getattr(settings, 'ADMIN_URL_SECRET', '')
        admin_path = f'/api/admin/{admin_secret}/'
        
        # چک کردن آیا درخواست برای ادمین است
        if request.path.startswith(admin_path):
            # ✅ استثنا: login, logout و کپتچا نیازی به چک‌های امنیتی ندارن
            if '/auth/login/' in request.path or '/auth/logout/' in request.path or '/captcha/' in request.path:
                return self.get_response(request)
            
            client_ip = self._get_client_ip(request)
            
            # ✅ ۰. چک بن بودن IP (اول از همه!)
            if IPBanService.is_banned(client_ip):
                logger.error(f"🚫 Blocked banned IP from admin: {client_ip}")
                return JsonResponse({
                    'error': 'Access denied',
                    'message': 'دسترسی شما مسدود شده است'
                }, status=403)
            
            # ۱. HTTPS اجباری (در پروداکشن)
            if not request.is_secure() and not settings.DEBUG:
                logger.warning(
                    f'🚨 Blocked non-HTTPS admin access from {client_ip}'
                )
                return JsonResponse({
                    'error': 'HTTPS required for admin access',
                    'message': 'دسترسی از طریق HTTPS الزامی است'
                }, status=403)
            
            # ۲. IP Whitelist (اختیاری)
            allowed_ips = getattr(settings, 'ADMIN_ALLOWED_IPS', [])
            if allowed_ips:
                if client_ip not in allowed_ips:
                    logger.warning(
                        f'🚨 Blocked admin access from unauthorized IP: {client_ip}'
                    )
                    return JsonResponse({
                        'error': 'Access denied',
                        'message': 'دسترسی از این IP مجاز نیست'
                    }, status=403)
            
            # ۳. لاگ کردن همه دسترسی‌ها
            logger.info(
                f'🔐 Admin access: {request.method} {request.path} from {client_ip}'
            )
        
        return self.get_response(request)
    
    def _get_client_ip(self, request):
        """دریافت IP واقعی کاربر"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR', 'Unknown')

