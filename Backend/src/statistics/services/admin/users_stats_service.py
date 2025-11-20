"""
User Statistics Service - Sensitive user data
Requires: statistics.users.read permission
"""
from django.core.cache import cache
from django.utils import timezone
from django.contrib.auth import get_user_model

User = get_user_model()


class UserStatsService:
    """
    User statistics - Sensitive data
    Counts, active users, new users, etc.
    """
    CACHE_KEY = 'admin_stats_users'
    CACHE_TIMEOUT = 300  # 5 minutes
    REQUIRED_PERMISSION = 'statistics.users.read'
    
    @classmethod
    def get_stats(cls) -> dict:
        """Get user statistics"""
        data = cache.get(cls.CACHE_KEY)
        if not data:
            data = cls._calculate_stats()
            cache.set(cls.CACHE_KEY, data, cls.CACHE_TIMEOUT)
        return data
    
    @classmethod
    def _calculate_stats(cls) -> dict:
        """Calculate user statistics"""
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
        """Clear user stats cache"""
        cache.delete(cls.CACHE_KEY)

