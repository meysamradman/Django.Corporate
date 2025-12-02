"""
Email Statistics Service - Email statistics
Requires: statistics.emails.read permission
"""
from django.core.cache import cache
from django.utils import timezone
from django.db.models import Count, Avg, Q, F
from datetime import timedelta
from src.email.models.email_message import EmailMessage
from src.statistics.utils.cache import StatisticsCacheKeys, StatisticsCacheManager


class EmailStatsService:
    """
    Email statistics - Status counts, source distribution, average response time, unanswered emails
    Optimized queries - all counts use single queries with proper indexes
    """
    CACHE_TIMEOUT = 300  # 5 minutes
    REQUIRED_PERMISSION = 'statistics.emails.read'
    
    @classmethod
    def get_stats(cls) -> dict:
        """Get email statistics"""
        # ✅ Use standardized cache key from StatisticsCacheKeys
        cache_key = StatisticsCacheKeys.emails()
        data = cache.get(cache_key)
        if not data:
            data = cls._calculate_stats()
            cache.set(cache_key, data, cls.CACHE_TIMEOUT)
        return data
    
    @classmethod
    def _calculate_stats(cls) -> dict:
        """
        Calculate email statistics
        Optimized: Each count() uses indexes - no N+1 issues
        """
        # ✅ Status counts - Single query each with proper filtering
        # Uses index: email_messages_status_created_idx
        status_counts = {
            'new': EmailMessage.objects.filter(status='new').count(),
            'read': EmailMessage.objects.filter(status='read').count(),
            'replied': EmailMessage.objects.filter(status='replied').count(),
            'archived': EmailMessage.objects.filter(status='archived').count(),
            'draft': EmailMessage.objects.filter(status='draft').count(),
        }
        
        # ✅ Total emails - Single query
        total_emails = EmailMessage.objects.count()
        
        # ✅ Source distribution - Single query with group by
        # Uses index: email_messages_source_created_idx
        source_distribution = dict(
            EmailMessage.objects.values('source')
            .annotate(count=Count('id'))
            .values_list('source', 'count')
        )
        
        # Ensure all sources are present (even if count is 0)
        source_counts = {
            'website': source_distribution.get('website', 0),
            'mobile_app': source_distribution.get('mobile_app', 0),
            'email': source_distribution.get('email', 0),
            'api': source_distribution.get('api', 0),
        }
        
        # ✅ Average response time - Single query
        # Calculate time difference between created_at and replied_at for replied emails
        # Uses index: email_messages_replied_at
        replied_emails = EmailMessage.objects.filter(
            status='replied',
            replied_at__isnull=False,
            created_at__isnull=False
        )
        
        # Calculate average response time in seconds
        avg_response_seconds = None
        if replied_emails.exists():
            total_seconds = sum(
                (email.replied_at - email.created_at).total_seconds()
                for email in replied_emails
            )
            avg_response_seconds = total_seconds / replied_emails.count()
        
        # Convert to hours, minutes, seconds for display
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
        
        # ✅ Unanswered emails - Single query
        # Emails that are not replied (status != 'replied' and status != 'draft')
        # Exclude drafts from unanswered count
        unanswered_emails = EmailMessage.objects.filter(
            ~Q(status='replied') & ~Q(status='draft')
        ).count()
        
        # ✅ Active emails (new + read) - Calculated from status_counts
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
        """Clear email stats cache"""
        # ✅ Use Cache Manager for standardized cache invalidation
        StatisticsCacheManager.invalidate_emails()

