"""
Admin Statistics Service - Highly sensitive admin data
Requires: statistics.admins.read permission
"""
from django.core.cache import cache
from django.utils import timezone
from django.contrib.auth import get_user_model
from src.statistics.utils.cache import StatisticsCacheKeys, StatisticsCacheManager

User = get_user_model()


class AdminStatsService:
    """
    Admin statistics - Highly sensitive data
    Admin counts, active admins, roles, etc.
    """
    CACHE_TIMEOUT = 300  # 5 minutes
    REQUIRED_PERMISSION = 'statistics.admins.read'
    
    @classmethod
    def get_stats(cls) -> dict:
        """Get admin statistics"""
        # ✅ Use standardized cache key from StatisticsCacheKeys
        cache_key = StatisticsCacheKeys.admins()
        data = cache.get(cache_key)
        if not data:
            data = cls._calculate_stats()
            cache.set(cache_key, data, cls.CACHE_TIMEOUT)
        return data
    
    @classmethod
    def _calculate_stats(cls) -> dict:
        """Calculate admin statistics"""
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
        """Clear admin stats cache"""
        # ✅ Use Cache Manager for standardized cache invalidation
        StatisticsCacheManager.invalidate_admins()

