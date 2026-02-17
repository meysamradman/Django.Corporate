from django.utils import timezone
from django.contrib.auth import get_user_model
from src.core.cache import CacheService
from src.analytics.utils.cache import AnalyticsCacheKeys, AnalyticsCacheManager
from src.analytics.utils.cache_ttl import AnalyticsCacheTTL

User = get_user_model()

class UserStatsService:
    REQUIRED_PERMISSION = 'analytics.users.read'
    
    @classmethod
    def get_stats(cls, use_cache: bool = True) -> dict:
        cache_key = AnalyticsCacheKeys.users()
        data = CacheService.get(cache_key) if use_cache else None
        if data is None:
            data = cls._calculate_stats()
            CacheService.set(cache_key, data, timeout=AnalyticsCacheTTL.ADMIN_STATS)
        return data
    
    @classmethod
    def _calculate_stats(cls) -> dict:
        total_users = User.objects.filter(user_type='user').count()
        active_users = User.objects.filter(user_type='user', is_active=True).count()
        
        return {
            'total_users': total_users,
            'active_users': active_users,
            'inactive_users': total_users - active_users,
            'generated_at': timezone.now().isoformat(),
        }
    
    @classmethod
    def clear_cache(cls):
        AnalyticsCacheManager.invalidate_users()

