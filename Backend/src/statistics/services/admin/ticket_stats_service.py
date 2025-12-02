"""
Ticket Statistics Service - Ticket statistics
Requires: statistics.tickets.read permission
"""
from django.core.cache import cache
from django.utils import timezone
from django.db.models import Count
from src.ticket.models.ticket import Ticket
from src.ticket.utils.cache import TicketCacheKeys
from src.statistics.utils.cache import StatisticsCacheKeys, StatisticsCacheManager


class TicketStatsService:
    """
    Ticket statistics - Status counts, priority distribution, unanswered tickets
    Optimized queries - all counts use single queries with proper indexes
    """
    CACHE_TIMEOUT = 300  # 5 minutes
    REQUIRED_PERMISSION = 'statistics.tickets.read'
    
    @classmethod
    def get_stats(cls) -> dict:
        """Get ticket statistics"""
        # ✅ Use standardized cache key from StatisticsCacheKeys (consistent with other stats)
        cache_key = StatisticsCacheKeys.tickets()
        data = cache.get(cache_key)
        if not data:
            data = cls._calculate_stats()
            cache.set(cache_key, data, cls.CACHE_TIMEOUT)
        return data
    
    @classmethod
    def _calculate_stats(cls) -> dict:
        """
        Calculate ticket statistics
        Optimized: Each count() uses indexes - no N+1 issues
        Total: 6 queries (status counts x4, priority distribution, unanswered)
        """
        # ✅ Status counts - Single query each with proper filtering
        # Django optimizes count() automatically - executes COUNT(*) SQL
        # Uses index: ticket_status_created_idx
        status_counts = {
            'open': Ticket.objects.filter(status='open').count(),
            'in_progress': Ticket.objects.filter(status='in_progress').count(),
            'resolved': Ticket.objects.filter(status='resolved').count(),
            'closed': Ticket.objects.filter(status='closed').count(),
        }
        
        # ✅ Total tickets - Single query
        total_tickets = Ticket.objects.count()
        
        # ✅ Priority distribution - Single query with group by
        # Uses index: ticket_priority_status_idx
        # Returns dict: {'low': count, 'medium': count, ...}
        priority_distribution = dict(
            Ticket.objects.values('priority')
            .annotate(count=Count('id'))
            .values_list('priority', 'count')
        )
        
        # Ensure all priorities are present (even if count is 0)
        priority_counts = {
            'low': priority_distribution.get('low', 0),
            'medium': priority_distribution.get('medium', 0),
            'high': priority_distribution.get('high', 0),
            'urgent': priority_distribution.get('urgent', 0),
        }
        
        # ✅ Unanswered tickets - Single query
        # Tickets that have no messages (last_replied_at is null)
        # Uses index: ticket_status_created_idx
        unanswered_tickets = Ticket.objects.filter(
            last_replied_at__isnull=True
        ).count()
        
        # ✅ Active tickets (open + in_progress) - Calculated from status_counts
        active_tickets = status_counts['open'] + status_counts['in_progress']
        
        return {
            'total_tickets': total_tickets,
            'status_counts': status_counts,
            'active_tickets': active_tickets,
            'priority_distribution': priority_counts,
            'unanswered_tickets': unanswered_tickets,
            'generated_at': timezone.now().isoformat(),
        }
    
    @classmethod
    def clear_cache(cls):
        """Clear ticket stats cache"""
        # ✅ Use Cache Manager for standardized cache invalidation
        StatisticsCacheManager.invalidate_tickets()

