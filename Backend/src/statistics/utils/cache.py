"""
Cache key utilities and cache management for statistics app
Standardized cache keys to avoid conflicts
"""
from django.core.cache import cache


class StatisticsCacheKeys:
    """Standardized cache keys for statistics app"""
    
    @staticmethod
    def dashboard():
        """Cache key for dashboard statistics"""
        return "admin_stats_dashboard_overview"
    
    @staticmethod
    def users():
        """Cache key for user statistics"""
        return "admin_stats_users"
    
    @staticmethod
    def admins():
        """Cache key for admin statistics"""
        return "admin_stats_admins"
    
    @staticmethod
    def content():
        """Cache key for content statistics"""
        return "admin_stats_content"
    
    @staticmethod
    def tickets():
        """Cache key for ticket statistics"""
        return "admin_stats_tickets"
    
    @staticmethod
    def emails():
        """Cache key for email statistics"""
        return "admin_stats_emails"
    
    @staticmethod
    def system():
        """Cache key for system statistics (database, cache, storage)"""
        return "admin_stats_system"
    
    @staticmethod
    def all_keys():
        """Return all cache keys for statistics"""
        return [
            StatisticsCacheKeys.dashboard(),
            StatisticsCacheKeys.users(),
            StatisticsCacheKeys.admins(),
            StatisticsCacheKeys.content(),
            StatisticsCacheKeys.tickets(),
            StatisticsCacheKeys.emails(),
            StatisticsCacheKeys.system(),
        ]


class StatisticsCacheManager:
    """Cache management utilities for statistics operations"""
    
    @staticmethod
    def invalidate_dashboard():
        """Invalidate dashboard statistics cache"""
        cache.delete(StatisticsCacheKeys.dashboard())
    
    @staticmethod
    def invalidate_users():
        """Invalidate user statistics cache"""
        cache.delete(StatisticsCacheKeys.users())
    
    @staticmethod
    def invalidate_admins():
        """Invalidate admin statistics cache"""
        cache.delete(StatisticsCacheKeys.admins())
    
    @staticmethod
    def invalidate_content():
        """Invalidate content statistics cache"""
        cache.delete(StatisticsCacheKeys.content())
    
    @staticmethod
    def invalidate_tickets():
        """Invalidate ticket statistics cache"""
        cache.delete(StatisticsCacheKeys.tickets())
    
    @staticmethod
    def invalidate_emails():
        """Invalidate email statistics cache"""
        cache.delete(StatisticsCacheKeys.emails())
    
    @staticmethod
    def invalidate_system():
        """Invalidate system statistics cache"""
        cache.delete(StatisticsCacheKeys.system())
    
    @staticmethod
    def invalidate_all():
        """Invalidate all statistics cache"""
        cache.delete_many(StatisticsCacheKeys.all_keys())

