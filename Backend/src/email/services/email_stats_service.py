from django.db.models import F
from django.utils import timezone
from src.email.models.statistics import EmailStatistics

class EmailStatsService:
    @staticmethod
    def _get_today_stats():
        today = timezone.now().date()
        stats, created = EmailStatistics.objects.get_or_create(
            date=today,
            defaults={
                'total_received': 0,
                'total_replied': 0,
                'status_distribution': {},
                'source_distribution': {}
            }
        )
        return stats

    @classmethod
    def track_new_email(cls, email_message):
        """
        Tracks a new email creation
        """
        stats = cls._get_today_stats()
        
        # Increment volume
        EmailStatistics.objects.filter(id=stats.id).update(
            total_received=F('total_received') + 1
        )
        
        # Update distributions
        stats.refresh_from_db()
        
        status = email_message.status
        source = email_message.source
        
        stats.status_distribution[status] = stats.status_distribution.get(status, 0) + 1
        stats.source_distribution[source] = stats.source_distribution.get(source, 0) + 1
        stats.save(update_fields=['status_distribution', 'source_distribution'])

    @classmethod
    def track_status_change(cls, email_message, old_status, new_status):
        """
        Tracks an email status change
        """
        stats = cls._get_today_stats()
        
        if old_status == new_status:
            return

        # Special case for 'replied'
        update_data = {}
        if new_status == 'replied' and old_status != 'replied':
            EmailStatistics.objects.filter(id=stats.id).update(
                total_replied=F('total_replied') + 1
            )
        
        # Update distribution
        stats.refresh_from_db()
        if old_status in stats.status_distribution:
            stats.status_distribution[old_status] = max(0, stats.status_distribution[old_status] - 1)
        
        stats.status_distribution[new_status] = stats.status_distribution.get(new_status, 0) + 1
        stats.save(update_fields=['status_distribution'])
