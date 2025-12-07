from django.apps import apps
from django.core.cache import cache
from django.utils import timezone
from django.db.models import Count, Avg, Q, F
from datetime import timedelta
from src.statistics.utils.cache import StatisticsCacheKeys, StatisticsCacheManager


class EmailStatsService:
    CACHE_TIMEOUT = 300
    REQUIRED_PERMISSION = 'statistics.emails.read'
    
    @classmethod
    def get_stats(cls) -> dict:
        cache_key = StatisticsCacheKeys.emails()
        data = cache.get(cache_key)
        if not data:
            data = cls._calculate_stats()
            cache.set(cache_key, data, cls.CACHE_TIMEOUT)
        return data
    
    @classmethod
    def _calculate_stats(cls) -> dict:
        # بررسی وجود اپ email
        if not apps.is_installed('src.email'):
            return {
                'total_emails': 0,
                'status_counts': {
                    'new': 0,
                    'read': 0,
                    'replied': 0,
                    'archived': 0,
                    'draft': 0,
                },
                'active_emails': 0,
                'source_distribution': {
                    'website': 0,
                    'mobile_app': 0,
                    'email': 0,
                    'api': 0,
                },
                'average_response_time': None,
                'unanswered_emails': 0,
                'generated_at': timezone.now().isoformat(),
            }
        
        # Import فقط اگر اپ نصب باشه
        from src.email.models.email_message import EmailMessage
        
        status_counts = {
            'new': EmailMessage.objects.filter(status='new').count(),
            'read': EmailMessage.objects.filter(status='read').count(),
            'replied': EmailMessage.objects.filter(status='replied').count(),
            'archived': EmailMessage.objects.filter(status='archived').count(),
            'draft': EmailMessage.objects.filter(status='draft').count(),
        }
        
        total_emails = EmailMessage.objects.count()
        
        source_distribution = dict(
            EmailMessage.objects.values('source')
            .annotate(count=Count('id'))
            .values_list('source', 'count')
        )
        
        source_counts = {
            'website': source_distribution.get('website', 0),
            'mobile_app': source_distribution.get('mobile_app', 0),
            'email': source_distribution.get('email', 0),
            'api': source_distribution.get('api', 0),
        }
        
        replied_emails = EmailMessage.objects.filter(
            status='replied',
            replied_at__isnull=False,
            created_at__isnull=False
        )
        
        avg_response_seconds = None
        if replied_emails.exists():
            total_seconds = sum(
                (email.replied_at - email.created_at).total_seconds()
                for email in replied_emails
            )
            avg_response_seconds = total_seconds / replied_emails.count()
        
        avg_response_time = None
        if avg_response_seconds:
            hours = int(avg_response_seconds // 3600)
            minutes = int((avg_response_seconds % 3600) // 60)
            seconds = int(avg_response_seconds % 60)
            avg_response_time = {
                'total_seconds': int(avg_response_seconds),
                'hours': hours,
                'minutes': minutes,
                'seconds': seconds,
                'formatted': f"{hours}h {minutes}m {seconds}s" if hours > 0 else f"{minutes}m {seconds}s"
            }
        
        unanswered_emails = EmailMessage.objects.filter(
            ~Q(status='replied') & ~Q(status='draft')
        ).count()
        
        active_emails = status_counts['new'] + status_counts['read']
        
        return {
            'total_emails': total_emails,
            'status_counts': status_counts,
            'active_emails': active_emails,
            'source_distribution': source_counts,
            'average_response_time': avg_response_time,
            'unanswered_emails': unanswered_emails,
            'generated_at': timezone.now().isoformat(),
        }
    
    @classmethod
    def clear_cache(cls):
        StatisticsCacheManager.invalidate_emails()

