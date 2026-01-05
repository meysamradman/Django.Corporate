from django.db.models.signals import post_save
from django.dispatch import receiver
from src.ticket.models.ticket import Ticket
from src.ticket.services.ticket_stats_service import TicketStatsService
from src.user.services.admin_performance_service import AdminPerformanceService

@receiver(post_save, sender=Ticket)
def track_ticket_analytics(sender, instance, created, **kwargs):
    """
    Tracks ticket analytics on creation and updates
    """
    if created:
        TicketStatsService.track_new_ticket(instance)
    else:
        # Check if status or priority changed
        status_changed = hasattr(instance, '_old_status') and instance._old_status != instance.status
        priority_changed = hasattr(instance, '_old_priority') and instance._old_priority != instance.priority
        
        if status_changed or priority_changed:
            TicketStatsService.track_ticket_update(
                instance, 
                old_status=getattr(instance, '_old_status', None),
                old_priority=getattr(instance, '_old_priority', None)
            )
            
        # Admin Performance Tracking
        if status_changed and instance.status == 'resolved' and instance.assigned_admin:
            # Calculate response time if needed
            response_time = None
            if instance.created_at:
                diff = timezone.now() - instance.created_at
                response_time = int(diff.total_seconds() / 60)
                
            AdminPerformanceService.track_task_completion(
                instance.assigned_admin,
                task_type='ticket',
                response_time_minutes=response_time
            )
