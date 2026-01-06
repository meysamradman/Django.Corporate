from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework.views import APIView
from rest_framework.parsers import JSONParser
from src.core.responses.response import APIResponse
from src.core.security.ip_management import IPBanService
from django.middleware.csrf import get_token
import time

SUSPICIOUS_USER_AGENTS = [
    'bot', 'crawler', 'spider', 'scraper', 'curl', 'wget', 
    'python-requests', 'nikto', 'sqlmap', 'nmap', 'masscan',
    'scanner', 'exploit', 'hack', 'attack'
]


@method_decorator(csrf_exempt, name='dispatch')
class FakeAdminLoginView(APIView):
    authentication_classes = []
    permission_classes = []
    throttle_classes = []
    parser_classes = [JSONParser]
    
    def get(self, request):
        ip = self._get_client_ip(request)
        
        if IPBanService.is_banned(ip):
            return APIResponse.error(
                message="دسترسی شما مسدود شده است",
                status_code=403
            )
        
        is_suspicious = self._is_suspicious(request)
        self._log_attempt(request, method='GET', is_suspicious=is_suspicious)
        csrf_token = get_token(request)
        
        return APIResponse.success(
            message="CSRF token retrieved",
            data={'csrf_token': csrf_token}
        )
    
    def post(self, request):
        ip = self._get_client_ip(request)
        
        if IPBanService.is_banned(ip):
            return APIResponse.error(
                message="دسترسی شما مسدود شده است",
                status_code=403
            )
        
        is_suspicious = self._is_suspicious(request)
        should_ban = IPBanService.record_attempt(ip)
        
        self._log_attempt(request, method='POST', data=request.data, is_suspicious=is_suspicious)
        
        time.sleep(2)
        
        return APIResponse.error(
            message="نام کاربری یا رمز عبور اشتباه است",
            status_code=401
        )
    
    def _is_suspicious(self, request):
        user_agent = request.META.get('HTTP_USER_AGENT', '').lower()
        
        for pattern in SUSPICIOUS_USER_AGENTS:
            if pattern in user_agent:
                return True
        
        return False
    
    def _log_attempt(self, request, method='GET', data=None, is_suspicious=False):
        ip = self._get_client_ip(request)
        user_agent = request.META.get('HTTP_USER_AGENT', 'Unknown')
        referer = request.META.get('HTTP_REFERER', 'Unknown')
        attempts = IPBanService.get_attempts(ip)
        
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
    
    def _get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR', 'Unknown')

