from django.core.cache import cache
from django.utils import timezone
from django.contrib.auth import get_user_model
from src.analytics.utils.cache import AnalyticsCacheKeys, AnalyticsCacheManager

User = get_user_model()


class UserStatsService:
    CACHE_TIMEOUT = 300
    REQUIRED_PERMISSION = 'analytics.users.read'
    
    @classmethod
    def get_stats(cls) -> dict:
        cache_key = AnalyticsCacheKeys.users()
        data = cache.get(cache_key)
        if not data:
            data = cls._calculate_stats()
            cache.set(cache_key, data, cls.CACHE_TIMEOUT)
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

