from django.db.models import F
from django.utils import timezone
from src.user.models.statistics import AdminPerformanceStatistics

class AdminPerformanceService:
    @staticmethod
    def _get_monthly_stats(admin_profile):
        now = timezone.now()
        stats, created = AdminPerformanceStatistics.objects.get_or_create(
            admin=admin_profile,
            year=now.year,
            month=now.month,
            defaults={
                'tickets_resolved': 0,
                'emails_replied': 0,
                'avg_response_time_minutes': 0,
                'properties_created': 0,
                'blogs_created': 0,
                'portfolios_created': 0,
                'login_count': 0
            }
        )
        return stats

    @classmethod
    def track_task_completion(cls, admin_profile, task_type='ticket', response_time_minutes=None):
        """
        Tracks ticket resolution or email reply
        """
        stats = cls._get_monthly_stats(admin_profile)
        
        update_fields = []
        if task_type == 'ticket':
            stats.tickets_resolved = F('tickets_resolved') + 1
            update_fields.append('tickets_resolved')
        elif task_type == 'email':
            stats.emails_replied = F('emails_replied') + 1
            update_fields.append('emails_replied')
            
        if response_time_minutes is not None:
            # Update running average for the month
            current_count = stats.tickets_resolved if task_type == 'ticket' else stats.emails_replied
            # Note: F expression makes it hard to calculate avg in memory, 
            # so we refresh first for accuracy if avg is needed
            stats.refresh_from_db()
            current_avg = stats.avg_response_time_minutes
            total_tasks = stats.tickets_resolved + stats.emails_replied
            
            if total_tasks > 0:
                new_avg = ((current_avg * (total_tasks - 1)) + response_time_minutes) / total_tasks
                stats.avg_response_time_minutes = int(new_avg)
                update_fields.append('avg_response_time_minutes')

        stats.save(update_fields=update_fields)

    @classmethod
    def track_content_creation(cls, admin_profile, content_type):
        """
        Tracks creation of Blog, Portfolio, or Property
        """
        stats = cls._get_monthly_stats(admin_profile)
        
        field_map = {
            'blog': 'blogs_created',
            'portfolio': 'portfolios_created',
            'property': 'properties_created'
        }
        
        field_name = field_map.get(content_type)
        if field_name:
            setattr(stats, field_name, F(field_name) + 1)
            stats.save(update_fields=[field_name])

    @classmethod
    def track_login(cls, admin_profile):
        """
        Tracks admin login
        """
        stats = cls._get_monthly_stats(admin_profile)
        stats.login_count = F('login_count') + 1
        stats.save(update_fields=['login_count'])
