from django.core.cache import cache
from django.utils import timezone
import json
import hashlib
import logging

logger = logging.getLogger(__name__)


class TrackingService:
    """سرویس ثبت بازدید - سریع با Redis"""
    
    @staticmethod
    def track(request, source='web'):
        """ثبت بازدید در Redis - زیر 1ms"""
        try:
            # ایجاد session key اگر وجود نداشت
            if not request.session.session_key:
                request.session.create()
            
            data = {
                'source': source,
                'path': request.path,
                'user_id': request.user.id if request.user.is_authenticated else None,
                'session_id': request.session.session_key,
                'ip': TrackingService._get_ip(request),
                'device': TrackingService._get_device(request),
                'timestamp': timezone.now().isoformat(),
            }
            
            key = f"analytics:view:{timezone.now().timestamp()}"
            cache.set(key, json.dumps(data), timeout=3600)
            
            return True
        except Exception as e:
            logger.debug(f"Tracking failed: {e}")
            return False
    
    @staticmethod
    def _get_ip(request):
        x_forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
        return x_forwarded.split(',')[0] if x_forwarded else request.META.get('REMOTE_ADDR')
    
    @staticmethod
    def _get_device(request):
        ua = request.META.get('HTTP_USER_AGENT', '').lower()
        if 'mobile' in ua:
            return 'mobile'
        elif 'tablet' in ua:
            return 'tablet'
        return 'desktop'
    
    @staticmethod
    def _gen_session(request):
        data = f"{request.META.get('HTTP_USER_AGENT', '')}{request.META.get('REMOTE_ADDR', '')}"
        return hashlib.md5(data.encode()).hexdigest()
