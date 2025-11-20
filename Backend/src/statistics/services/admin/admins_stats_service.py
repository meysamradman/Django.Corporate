"""
Admin Statistics Service - Highly sensitive admin data
Requires: statistics.admins.read permission
"""
from django.core.cache import cache
from django.utils import timezone
from django.contrib.auth import get_user_model

User = get_user_model()


class AdminStatsService:
    """
    Admin statistics - Highly sensitive data
    Admin counts, active admins, roles, etc.
    """
    CACHE_KEY = 'admin_stats_admins'
    CACHE_TIMEOUT = 300  # 5 minutes
    REQUIRED_PERMISSION = 'statistics.admins.read'
    
    @classmethod
    def get_stats(cls) -> dict:
        """Get admin statistics"""
        data = cache.get(cls.CACHE_KEY)
        if not data:
            data = cls._calculate_stats()
            cache.set(cls.CACHE_KEY, data, cls.CACHE_TIMEOUT)
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
        cache.delete(cls.CACHE_KEY)

