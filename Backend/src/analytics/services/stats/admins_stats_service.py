from django.core.cache import cache
from django.utils import timezone
from django.contrib.auth import get_user_model
from src.analytics.utils.cache import AnalyticsCacheKeys, AnalyticsCacheManager

User = get_user_model()


class AdminStatsService:
    CACHE_TIMEOUT = 300
    REQUIRED_PERMISSION = 'analytics.admins.read'
    
    @classmethod
    def get_stats(cls) -> dict:
        cache_key = AnalyticsCacheKeys.admins()
        data = cache.get(cache_key)
        if not data:
            data = cls._calculate_stats()
            cache.set(cache_key, data, cls.CACHE_TIMEOUT)
        return data
    
    @classmethod
    def _calculate_stats(cls) -> dict:
        total_admins = User.objects.filter(is_staff=True, user_type='admin').count()
        active_admins = User.objects.filter(is_staff=True, user_type='admin', is_active=True).count()
        
        return {
            'total_admins': total_admins,
            'active_admins': active_admins,
            'inactive_admins': total_admins - active_admins,
            'generated_at': timezone.now().isoformat(),
        }
    
    @classmethod
    def clear_cache(cls):
        AnalyticsCacheManager.invalidate_admins()

