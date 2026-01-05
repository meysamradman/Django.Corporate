from django.db.models import F, Avg
from django.utils import timezone
from src.ticket.models.statistics import TicketStatistics
from src.ticket.models.ticket import Ticket

class TicketStatsService:
    @staticmethod
    def _get_today_stats():
        today = timezone.now().date()
        stats, created = TicketStatistics.objects.get_or_create(
            date=today,
            defaults={
                'total_created': 0,
                'total_closed': 0,
                'avg_response_time_minutes': 0,
                'priority_distribution': {},
                'status_distribution': {}
            }
        )
        return stats

    @classmethod
    def track_new_ticket(cls, ticket):
        """
        Tracks a new ticket creation
        """
        stats = cls._get_today_stats()
        
        # Increment volume
        TicketStatistics.objects.filter(id=stats.id).update(
            total_created=F('total_created') + 1
        )
        
        # Update distributions
        stats.refresh_from_db()
        
        status = ticket.status
        priority = ticket.priority
        
        stats.status_distribution[status] = stats.status_distribution.get(status, 0) + 1
        stats.priority_distribution[priority] = stats.priority_distribution.get(priority, 0) + 1
        stats.save(update_fields=['status_distribution', 'priority_distribution'])

    @classmethod
    def track_ticket_update(cls, ticket, old_status=None, old_priority=None):
        """
        Tracks a ticket update (status, priority, or closure)
        """
        stats = cls._get_today_stats()
        
        # 1. Update distributions if changed
        stats.refresh_from_db()
        changed = False
        
        if old_status and old_status != ticket.status:
            if old_status in stats.status_distribution:
                stats.status_distribution[old_status] = max(0, stats.status_distribution[old_status] - 1)
            stats.status_distribution[ticket.status] = stats.status_distribution.get(ticket.status, 0) + 1
            
            # Special case for closure
            if ticket.status == 'closed' and old_status != 'closed':
                TicketStatistics.objects.filter(id=stats.id).update(
                    total_closed=F('total_closed') + 1
                )
            changed = True
            
        if old_priority and old_priority != ticket.priority:
            if old_priority in stats.priority_distribution:
                stats.priority_distribution[old_priority] = max(0, stats.priority_distribution[old_priority] - 1)
            stats.priority_distribution[ticket.priority] = stats.priority_distribution.get(ticket.priority, 0) + 1
            changed = True
            
        if changed:
            # Update average response time if this is the first response/resolution
            if ticket.status in ['in_progress', 'resolved', 'closed'] and not old_status in ['in_progress', 'resolved', 'closed']:
                cls._update_avg_response_time(stats, ticket)
            
            stats.save(update_fields=['status_distribution', 'priority_distribution', 'avg_response_time_minutes'])

    @classmethod
    def _update_avg_response_time(cls, stats, ticket):
        """
        Updates the running average response time for today
        """
        if not ticket.created_at:
            return
            
        time_diff = timezone.now() - ticket.created_at
        minutes = int(time_diff.total_seconds() / 60)
        
        # Simple running average logic
        # New Avg = ((Old Avg * Count) + New Value) / (Count + 1)
        count = stats.total_created  # Approximate count for averaging
        if count > 0:
            current_avg = stats.avg_response_time_minutes
            new_avg = ((current_avg * (count - 1)) + minutes) / count
            stats.avg_response_time_minutes = int(new_avg)
        else:
            stats.avg_response_time_minutes = minutes
