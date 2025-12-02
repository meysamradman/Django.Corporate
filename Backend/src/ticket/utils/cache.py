"""
Cache key utilities and cache management for ticket app
Standardized cache keys to avoid conflicts
"""
from django.core.cache import cache


class TicketCacheKeys:
    """Standardized cache keys for ticket app"""
    
    @staticmethod
    def ticket(ticket_id):
        """Cache key for ticket object"""
        return f"ticket:{ticket_id}"
    
    @staticmethod
    def messages(ticket_id):
        """Cache key for ticket messages"""
        return f"ticket:{ticket_id}:messages"
    
    @staticmethod
    def stats():
        """Cache key for ticket statistics (legacy - used in views)"""
        return "ticket:stats"
    
    @staticmethod
    def admin_stats():
        """Cache key for admin ticket statistics (legacy - now uses StatisticsCacheKeys)"""
        # Note: This is kept for backward compatibility
        # New code should use StatisticsCacheKeys.tickets()
        return "admin_stats_tickets"
    
    @staticmethod
    def all_keys(ticket_id):
        """Return all cache keys for a ticket"""
        return [
            TicketCacheKeys.ticket(ticket_id),
            TicketCacheKeys.messages(ticket_id),
        ]


class TicketCacheManager:
    """Cache management utilities for ticket operations"""
    
    @staticmethod
    def invalidate_ticket(ticket_id):
        """Invalidate all cache for a specific ticket"""
        cache.delete(TicketCacheKeys.ticket(ticket_id))
        cache.delete(TicketCacheKeys.messages(ticket_id))
    
    @staticmethod
    def invalidate_stats():
        """Invalidate all ticket statistics cache"""
        from src.statistics.utils.cache import StatisticsCacheManager
        cache.delete(TicketCacheKeys.stats())  # Legacy key
        StatisticsCacheManager.invalidate_tickets()  # ✅ Use Statistics Cache Manager
    
    @staticmethod
    def invalidate_all(ticket_id=None):
        """Invalidate all ticket-related cache"""
        if ticket_id:
            TicketCacheManager.invalidate_ticket(ticket_id)
        TicketCacheManager.invalidate_stats()

