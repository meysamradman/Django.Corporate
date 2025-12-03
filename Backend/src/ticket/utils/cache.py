from django.core.cache import cache

from src.statistics.utils.cache import StatisticsCacheManager


class TicketCacheKeys:
    
    @staticmethod
    def ticket(ticket_id):
        return f"ticket:{ticket_id}"
    
    @staticmethod
    def messages(ticket_id):
        return f"ticket:{ticket_id}:messages"
    
    @staticmethod
    def stats():
        return "ticket:stats"
    
    @staticmethod
    def admin_stats():
        return "admin_stats_tickets"
    
    @staticmethod
    def all_keys(ticket_id):
        return [
            TicketCacheKeys.ticket(ticket_id),
            TicketCacheKeys.messages(ticket_id),
        ]


class TicketCacheManager:
    
    @staticmethod
    def invalidate_ticket(ticket_id):
        cache.delete(TicketCacheKeys.ticket(ticket_id))
        cache.delete(TicketCacheKeys.messages(ticket_id))
    
    @staticmethod
    def invalidate_stats():
        cache.delete(TicketCacheKeys.stats())
        StatisticsCacheManager.invalidate_tickets()
    
    @staticmethod
    def invalidate_all(ticket_id=None):
        if ticket_id:
            TicketCacheManager.invalidate_ticket(ticket_id)
        TicketCacheManager.invalidate_stats()

