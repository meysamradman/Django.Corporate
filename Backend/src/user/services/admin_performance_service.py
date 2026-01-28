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
        
        stats = cls._get_monthly_stats(admin_profile)
        
        update_data = {
            'updated_at': timezone.now()
        }
        
        if task_type == 'ticket':
            update_data['tickets_resolved'] = F('tickets_resolved') + 1
        elif task_type == 'email':
            update_data['emails_replied'] = F('emails_replied') + 1
            
        if response_time_minutes is not None:
            stats.refresh_from_db()
            current_avg = stats.avg_response_time_minutes
            total_tasks = stats.tickets_resolved + stats.emails_replied + 1 # +1 for the current one
            
            if total_tasks > 0:
                new_avg = ((current_avg * (total_tasks - 1)) + response_time_minutes) / total_tasks
                update_data['avg_response_time_minutes'] = int(new_avg)

        AdminPerformanceStatistics.objects.filter(pk=stats.pk).update(**update_data)

    @classmethod
    def track_content_creation(cls, admin_profile, content_type):
        
        stats = cls._get_monthly_stats(admin_profile)
        
        field_map = {
            'blog': 'blogs_created',
            'portfolio': 'portfolios_created',
            'property': 'properties_created'
        }
        
        field_name = field_map.get(content_type)
        if field_name:
            AdminPerformanceStatistics.objects.filter(pk=stats.pk).update(
                **{field_name: F(field_name) + 1},
                updated_at=timezone.now()
            )

    @classmethod
    def track_login(cls, admin_profile):
        
        stats = cls._get_monthly_stats(admin_profile)
        AdminPerformanceStatistics.objects.filter(pk=stats.pk).update(
            login_count=F('login_count') + 1,
            updated_at=timezone.now()
        )
