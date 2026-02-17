from django.utils import timezone
from django.contrib.auth import get_user_model
from src.core.cache import CacheService
from src.analytics.utils.cache import AnalyticsCacheKeys, AnalyticsCacheManager
from src.analytics.utils.cache_ttl import AnalyticsCacheTTL

User = get_user_model()

class AdminStatsService:
    REQUIRED_PERMISSION = 'analytics.admins.read'
    
    @classmethod
    def get_stats(cls, use_cache: bool = True) -> dict:
        cache_key = AnalyticsCacheKeys.admins()
        data = CacheService.get(cache_key) if use_cache else None
        if data is None:
            data = cls._calculate_stats()
            CacheService.set(cache_key, data, timeout=AnalyticsCacheTTL.ADMIN_STATS)
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

