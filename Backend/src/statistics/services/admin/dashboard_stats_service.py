from django.apps import apps
from django.core.cache import cache
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.db.models import Q
from src.statistics.utils.cache import StatisticsCacheKeys, StatisticsCacheManager

User = get_user_model()


class DashboardStatsService:
    CACHE_TIMEOUT = 300
    
    @classmethod
    def get_stats(cls) -> dict:
        cache_key = StatisticsCacheKeys.dashboard()
        data = cache.get(cache_key)
        if not data:
            data = cls._calculate_stats()
            cache.set(cache_key, data, cls.CACHE_TIMEOUT)
        return data
    
    @classmethod
    def _calculate_stats(cls) -> dict:
        stats = {
            'generated_at': timezone.now().isoformat(),
        }
        
        # Core stats - همیشه موجود
        stats['total_users'] = User.objects.filter(
            user_type='user',
            is_staff=False
        ).count()
        
        stats['total_admins'] = User.objects.filter(
            user_type='admin',
            is_staff=True,
            is_admin_active=True
        ).count()
        
        # Media stats - همیشه موجود (CORE APP)
        if apps.is_installed('src.media'):
            from src.media.models.media import ImageMedia, VideoMedia, AudioMedia, DocumentMedia
            stats['total_media'] = (
                ImageMedia.objects.count() +
                VideoMedia.objects.count() +
                AudioMedia.objects.count() +
                DocumentMedia.objects.count()
            )
        else:
            stats['total_media'] = 0
        
        # Portfolio stats - اختیاری (CORPORATE APP)
        if apps.is_installed('src.portfolio'):
            from src.portfolio.models.portfolio import Portfolio
            from src.portfolio.models.category import PortfolioCategory
            from src.portfolio.models.tag import PortfolioTag
            from src.portfolio.models.option import PortfolioOption
            
            stats['total_portfolios'] = Portfolio.objects.count()
            stats['total_portfolio_categories'] = PortfolioCategory.objects.count()
            stats['total_portfolio_tags'] = PortfolioTag.objects.count()
            stats['total_portfolio_options'] = PortfolioOption.objects.count()
        else:
            stats['total_portfolios'] = 0
            stats['total_portfolio_categories'] = 0
            stats['total_portfolio_tags'] = 0
            stats['total_portfolio_options'] = 0
        
        # Blog stats - اختیاری (CORPORATE APP)
        if apps.is_installed('src.blog'):
            from src.blog.models.blog import Blog
            from src.blog.models.category import BlogCategory
            from src.blog.models.tag import BlogTag
            
            stats['total_posts'] = Blog.objects.count()
            stats['total_blog_categories'] = BlogCategory.objects.count()
            stats['total_blog_tags'] = BlogTag.objects.count()
        else:
            stats['total_posts'] = 0
            stats['total_blog_categories'] = 0
            stats['total_blog_tags'] = 0
        
        # Email stats - اختیاری (CORPORATE APP)
        if apps.is_installed('src.email'):
            from src.email.models.email_message import EmailMessage
            
            stats['total_emails'] = EmailMessage.objects.count()
            stats['new_emails'] = EmailMessage.objects.filter(status='new').count()
            stats['unanswered_emails'] = EmailMessage.objects.filter(
                ~Q(status='replied') & ~Q(status='draft')
            ).count()
        else:
            stats['total_emails'] = 0
            stats['new_emails'] = 0
            stats['unanswered_emails'] = 0
        
        # Ticket stats - اختیاری (CORPORATE APP)
        if apps.is_installed('src.ticket'):
            from src.ticket.models.ticket import Ticket
            
            stats['total_tickets'] = Ticket.objects.count()
            stats['open_tickets'] = Ticket.objects.filter(status='open').count()
            stats['in_progress_tickets'] = Ticket.objects.filter(status='in_progress').count()
            stats['active_tickets'] = stats['open_tickets'] + stats['in_progress_tickets']
            stats['unanswered_tickets'] = Ticket.objects.filter(
                last_replied_at__isnull=True
            ).count()
        else:
            stats['total_tickets'] = 0
            stats['open_tickets'] = 0
            stats['in_progress_tickets'] = 0
            stats['active_tickets'] = 0
            stats['unanswered_tickets'] = 0
        
        return stats
    
    @classmethod
    def clear_cache(cls):
        StatisticsCacheManager.invalidate_dashboard()

