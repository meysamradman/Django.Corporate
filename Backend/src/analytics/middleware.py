import time
import json
from django.utils.deprecation import MiddlewareMixin
from src.core.cache import CacheService
from .services.tracking import TrackingService
from .services.realtime import OnlineUsersRealtimeService
from .utils.geoip import get_country_from_ip

class AnalyticsMiddleware(MiddlewareMixin):
    
    ANALYTICS_QUEUE = "analytics:queue"
    
    def process_request(self, request):
        request._start_time = time.time()
    
    def process_response(self, request, response):
        if hasattr(request, '_start_time'):
            response_time = int((time.time() - request._start_time) * 1000)
        else:
            response_time = None
        
        if request.user.is_authenticated:
            return response
        
        excluded_paths = ['/api/admin/', '/static/', '/media/', '/admin/', '/__debug__/', '/silk/']
        if any(request.path.startswith(p) for p in excluded_paths):
            return response
        
        source = self._detect_source(request)
        
        if source == 'web' or (source == 'app' and request.path.startswith('/api/')):
            self._track_visit(request, source, response_time)
        
        return response
    
    def _detect_source(self, request):
        custom_source = request.META.get('HTTP_X_SOURCE')
        if custom_source:
            valid_sources = ['web', 'app', 'desktop', 'bot', 'other']
            return custom_source if custom_source in valid_sources else 'other'

        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        if auth_header.startswith('Bearer '):
            return 'app'
        
        if request.META.get('HTTP_X_APP_SOURCE'):
            return 'app'
        
        user_agent = request.META.get('HTTP_USER_AGENT', '').lower()
        app_indicators = ['flutter', 'dart', 'react-native', 'cordova', 'ionic', 'capacitor']
        
        if any(indicator in user_agent for indicator in app_indicators):
            return 'app'
        
        return 'web'
    
    def _track_visit(self, request, source, response_time):
        try:
            if not request.session.session_key:
                request.session.create()
            
            ip_address = TrackingService._get_ip(request)
            country = get_country_from_ip(ip_address)
            
            site_id = request.META.get('HTTP_X_SITE_ID') or request.get_host()
            
            device, browser, os_name = self._parse_user_agent(
                request.META.get('HTTP_USER_AGENT', '')
            )
            
            visit_data = {
                'source': source,
                'user_id': None,
                'session_key': request.session.session_key,
                'path': request.path,
                'method': request.method,
                'site_id': site_id,
                'ip_address': ip_address,
                'country': country,
                'device': device,
                'browser': browser,
                'os': os_name,
                'user_agent': request.META.get('HTTP_USER_AGENT', ''),
                'referrer': request.META.get('HTTP_REFERER', ''),
                'response_time': response_time,
                'timestamp': time.time(),
            }
            
            CacheService.list_push(self.ANALYTICS_QUEUE, json.dumps(visit_data), side='left')
            CacheService.list_trim(self.ANALYTICS_QUEUE, 0, 9999)
            OnlineUsersRealtimeService.touch_session(
                session_id=request.session.session_key,
                site_id=site_id,
            )
            
        except Exception as e:
            pass
    
    def _parse_user_agent(self, user_agent_string):
        ua = user_agent_string.lower()
        
        if 'mobile' in ua or 'android' in ua or 'iphone' in ua:
            device = 'mobile'
        elif 'tablet' in ua or 'ipad' in ua:
            device = 'tablet'
        else:
            device = 'desktop'
        
        if 'edg' in ua:
            browser = 'Edge'
        elif 'chrome' in ua:
            browser = 'Chrome'
        elif 'safari' in ua:
            browser = 'Safari'
        elif 'firefox' in ua:
            browser = 'Firefox'
        elif 'opera' in ua or 'opr' in ua:
            browser = 'Opera'
        else:
            browser = 'Other'
        
        if 'windows' in ua:
            os_name = 'Windows'
        elif 'mac' in ua:
            os_name = 'macOS'
        elif 'linux' in ua:
            os_name = 'Linux'
        elif 'android' in ua:
            os_name = 'Android'
        elif 'iphone' in ua or 'ipad' in ua:
            os_name = 'iOS'
        else:
            os_name = 'Other'
        
        return device, browser, os_name
