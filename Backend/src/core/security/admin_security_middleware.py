from django.http import JsonResponse
from django.conf import settings
from src.core.security.ip_management import IPBanService
from src.core.security.messages import SECURITY_ERRORS, SECURITY_MESSAGES

class AdminSecurityMiddleware:
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        is_admin_path = (
            request.path.startswith('/api/admin/') and
            not request.path.startswith('/api/admin/login/') and  # Honeypot
            not request.path.startswith('/api/admin/user/')  # User URLs
        )
        
        if is_admin_path:
            admin_secret = getattr(settings, 'ADMIN_URL_SECRET', '')
            secret_login_path = f'/api/admin/{admin_secret}/auth/login/'
            secret_captcha_path = f'/api/admin/{admin_secret}/auth/captcha/'

            if request.path == secret_login_path or request.path.startswith(secret_captcha_path):
                return self.get_response(request)
            
            if ('/auth/logout/' in request.path or 
                '/auth/register/' in request.path or 
                '/permissions/map/' in request.path or 
                '/permissions/check/' in request.path):
                return self.get_response(request)
            
            client_ip = self._get_client_ip(request)
            
            if IPBanService.is_banned(client_ip):
                return JsonResponse({
                    'error': SECURITY_ERRORS['access_denied'],
                    'message': SECURITY_MESSAGES['ip_blocked']
                }, status=403)
            
            if not request.is_secure() and not settings.DEBUG:
                return JsonResponse({
                    'error': SECURITY_ERRORS['https_required'],
                    'message': SECURITY_MESSAGES['https_required']
                }, status=403)
            
            allowed_ips = getattr(settings, 'ADMIN_ALLOWED_IPS', [])
            if allowed_ips:
                if client_ip not in allowed_ips:
                    return JsonResponse({
                        'error': SECURITY_ERRORS['access_denied'],
                        'message': SECURITY_MESSAGES['ip_not_allowed']
                    }, status=403)

        return self.get_response(request)
    
    def _get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR', 'Unknown')

