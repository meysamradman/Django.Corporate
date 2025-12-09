import time
import json
import logging
from django.utils.deprecation import MiddlewareMixin
from django_redis import get_redis_connection
from .services.tracking import TrackingService
from .utils.geoip import get_country_from_ip

logger = logging.getLogger(__name__)


class AnalyticsMiddleware(MiddlewareMixin):
    """
    Middleware سبک - ثبت بازدید وب و اپ (< 1ms)
    
    ✅ تغییرات:
    - استفاده از Redis List بجای keys() - بسیار سریعتر
    - پشتیبانی از پاکسازی Browser Cache
    - تشخیص بهتر دستگاه
    
    منطق:
    ✅ مهمان (Guest) → شمارش می‌شود
    ❌ کاربر ثبت‌نام شده → شمارش نمی‌شود (چون عضو سایت هستند)
    ❌ ادمین → شمارش نمی‌شود
    
    هدف: فقط بازدیدکنندگان واقعی (مهمان‌ها) شمارش شوند
    """
    
    ANALYTICS_QUEUE = "analytics:queue"  # Redis List
    
    def process_request(self, request):
        request._start_time = time.time()
    
    def process_response(self, request, response):
        # محاسبه زمان پاسخ
        if hasattr(request, '_start_time'):
            response_time = int((time.time() - request._start_time) * 1000)
        else:
            response_time = None
        
        # ✅ فیلتر 1: فقط مهمان‌ها (Guest) شمارش می‌شوند
        if request.user.is_authenticated:
            return response
        
        # ✅ فیلتر 2: مسیرهای غیرضروری
        excluded_paths = ['/api/admin/', '/static/', '/media/', '/admin/', '/__debug__/', '/silk/']
        if any(request.path.startswith(p) for p in excluded_paths):
            return response
        
        # تشخیص منبع: web یا app
        source = self._detect_source(request)
        
        # ✅ ثبت بازدید
        if source == 'web' or (source == 'app' and request.path.startswith('/api/')):
            self._track_visit(request, source, response_time)
        
        return response
    
    def _detect_source(self, request):
        """تشخیص منبع: web یا app"""
        # 1. بررسی JWT (اپلیکیشن موبایل)
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        if auth_header.startswith('Bearer '):
            return 'app'
        
        # 2. بررسی header سفارشی
        if request.META.get('HTTP_X_APP_SOURCE'):
            return 'app'
        
        # 3. بررسی User-Agent
        user_agent = request.META.get('HTTP_USER_AGENT', '').lower()
        app_indicators = ['flutter', 'dart', 'react-native', 'cordova', 'ionic', 'capacitor']
        
        if any(indicator in user_agent for indicator in app_indicators):
            return 'app'
        
        return 'web'
    
    def _track_visit(self, request, source, response_time):
        """
        ثبت بازدید در Redis List - خیلی سریع (< 1ms)
        
        ✅ تغییرات:
        - استفاده از LPUSH بجای SET - بسیار سریعتر
        - تشخیص دقیق‌تر دستگاه
        """
        try:
            # ایجاد session key
            if not request.session.session_key:
                request.session.create()
            
            ip_address = TrackingService._get_ip(request)
            country = get_country_from_ip(ip_address)
            
            # تشخیص دقیق دستگاه
            device, browser, os_name = self._parse_user_agent(
                request.META.get('HTTP_USER_AGENT', '')
            )
            
            visit_data = {
                'source': source,
                'user_id': None,  # همیشه None (فقط Guest)
                'session_key': request.session.session_key,
                'path': request.path,
                'method': request.method,
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
            
            # ✅ استفاده از Redis List - بسیار سریع
            redis_conn = get_redis_connection("default")
            redis_conn.lpush(self.ANALYTICS_QUEUE, json.dumps(visit_data))
            
            # ✅ محدود کردن سایز queue (نگه‌داری فقط آخرین 10000)
            redis_conn.ltrim(self.ANALYTICS_QUEUE, 0, 9999)
            
        except Exception as e:
            logger.debug(f"Analytics tracking failed: {e}")
    
    def _parse_user_agent(self, user_agent_string):
        """
        تشخیص دقیق دستگاه، مرورگر و OS
        
        Returns:
            tuple: (device, browser, os)
        """
        ua = user_agent_string.lower()
        
        # تشخیص دستگاه
        if 'mobile' in ua or 'android' in ua or 'iphone' in ua:
            device = 'mobile'
        elif 'tablet' in ua or 'ipad' in ua:
            device = 'tablet'
        else:
            device = 'desktop'
        
        # تشخیص مرورگر
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
        
        # تشخیص OS
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
