from django.core.cache import cache
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.db.models import Q
from src.portfolio.models.portfolio import Portfolio
from src.portfolio.models.category import PortfolioCategory
from src.portfolio.models.tag import PortfolioTag
from src.portfolio.models.option import PortfolioOption
from src.blog.models.blog import Blog
from src.blog.models.category import BlogCategory
from src.blog.models.tag import BlogTag
from src.media.models.media import ImageMedia, VideoMedia, AudioMedia, DocumentMedia
from src.email.models.email_message import EmailMessage
from src.ticket.models.ticket import Ticket
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
        total_media = (
            ImageMedia.objects.count() +
            VideoMedia.objects.count() +
            AudioMedia.objects.count() +
            DocumentMedia.objects.count()
        )
        
        total_users = User.objects.filter(
            user_type='user',
            is_staff=False
        ).count()
        
        total_admins = User.objects.filter(
            user_type='admin',
            is_staff=True,
            is_admin_active=True
        ).count()
        
        total_portfolios = Portfolio.objects.count()
        
        total_portfolio_categories = PortfolioCategory.objects.count()
        total_portfolio_tags = PortfolioTag.objects.count()
        total_portfolio_options = PortfolioOption.objects.count()
        
        total_posts = Blog.objects.count()
        
        total_blog_categories = BlogCategory.objects.count()
        total_blog_tags = BlogTag.objects.count()
        
        total_emails = EmailMessage.objects.count()
        new_emails = EmailMessage.objects.filter(status='new').count()
        unanswered_emails = EmailMessage.objects.filter(
            ~Q(status='replied') & ~Q(status='draft')
        ).count()
        
        total_tickets = Ticket.objects.count()
        open_tickets = Ticket.objects.filter(status='open').count()
        in_progress_tickets = Ticket.objects.filter(status='in_progress').count()
        active_tickets = open_tickets + in_progress_tickets
        unanswered_tickets = Ticket.objects.filter(
            last_replied_at__isnull=True
        ).count()
        
        return {
            'total_users': total_users,
            'total_admins': total_admins,
            'total_portfolios': total_portfolios,
            'total_portfolio_categories': total_portfolio_categories,
            'total_portfolio_tags': total_portfolio_tags,
            'total_portfolio_options': total_portfolio_options,
            'total_media': total_media,
            'total_posts': total_posts,
            'total_blog_categories': total_blog_categories,
            'total_blog_tags': total_blog_tags,
            'total_emails': total_emails,
            'new_emails': new_emails,
            'unanswered_emails': unanswered_emails,
            'total_tickets': total_tickets,
            'open_tickets': open_tickets,
            'active_tickets': active_tickets,
            'unanswered_tickets': unanswered_tickets,
            'generated_at': timezone.now().isoformat(),
        }
    
    @classmethod
    def clear_cache(cls):
        StatisticsCacheManager.invalidate_dashboard()

