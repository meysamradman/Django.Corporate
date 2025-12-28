from django.http import JsonResponse
from django.conf import settings
from src.core.security.ip_management import IPBanService
import logging

logger = logging.getLogger('admin_security')


class AdminSecurityMiddleware:
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        # چک کردن آیا درخواست برای ادمین است
        # حالا فقط login با secret path است، بقیه URLها معمولی هستند
        is_admin_path = (
            request.path.startswith('/api/admin/') and
            not request.path.startswith('/api/admin/login/') and  # Honeypot
            not request.path.startswith('/api/admin/user/')  # User URLs
        )
        
        if is_admin_path:
            admin_secret = getattr(settings, 'ADMIN_URL_SECRET', '')
            secret_login_path = f'/api/admin/{admin_secret}/auth/login/'
            secret_captcha_path = f'/api/admin/{admin_secret}/auth/captcha/'
            
            # ✅ استثنا: login با secret و captcha نیازی به چک‌های امنیتی ندارن
            if request.path == secret_login_path or request.path.startswith(secret_captcha_path):
                return self.get_response(request)
            
            # ✅ استثنا: logout و register هم نیازی به چک‌های امنیتی ندارن (بعد از login)
            if '/auth/logout/' in request.path or '/auth/register/' in request.path:
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

