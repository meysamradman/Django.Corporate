from django.apps import apps
from django.core.cache import cache
from django.utils import timezone
from django.db.models import Count
from src.analytics.utils.cache import AnalyticsCacheKeys, AnalyticsCacheManager


class TicketStatsService:
    CACHE_TIMEOUT = 300
    REQUIRED_PERMISSION = 'analytics.tickets.read'
    
    @classmethod
    def get_stats(cls) -> dict:
        cache_key = AnalyticsCacheKeys.tickets()
        data = cache.get(cache_key)
        if not data:
            data = cls._calculate_stats()
            cache.set(cache_key, data, cls.CACHE_TIMEOUT)
        return data
    
    @classmethod
    def _calculate_stats(cls) -> dict:
        # بررسی وجود اپ ticket
        if not apps.is_installed('src.ticket'):
            return {
                'total_tickets': 0,
                'status_counts': {
                    'open': 0,
                    'in_progress': 0,
                    'resolved': 0,
                    'closed': 0,
                },
                'active_tickets': 0,
                'priority_distribution': {
                    'low': 0,
                    'medium': 0,
                    'high': 0,
                    'urgent': 0,
                },
                'unanswered_tickets': 0,
                'generated_at': timezone.now().isoformat(),
            }
        
        from src.ticket.models.ticket import Ticket
        
        status_counts = {
            'open': Ticket.objects.filter(status='open').count(),
            'in_progress': Ticket.objects.filter(status='in_progress').count(),
            'resolved': Ticket.objects.filter(status='resolved').count(),
            'closed': Ticket.objects.filter(status='closed').count(),
        }
        
        total_tickets = Ticket.objects.count()
        
        priority_distribution = dict(
            Ticket.objects.values('priority')
            .annotate(count=Count('id'))
            .values_list('priority', 'count')
        )
        
        priority_counts = {
            'low': priority_distribution.get('low', 0),
            'medium': priority_distribution.get('medium', 0),
            'high': priority_distribution.get('high', 0),
            'urgent': priority_distribution.get('urgent', 0),
        }
        
        unanswered_tickets = Ticket.objects.filter(
            last_replied_at__isnull=True
        ).count()
        
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
        AnalyticsCacheManager.invalidate_tickets()

