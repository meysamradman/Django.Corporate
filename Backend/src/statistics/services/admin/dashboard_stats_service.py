"""
Dashboard Statistics Service - General overview stats
No permission required - available to all admins (BASE_ADMIN_PERMISSIONS)
"""
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
    """
    General dashboard statistics - Non-sensitive data only
    Optimized to avoid N+1 queries - all counts use single queries
    """
    CACHE_TIMEOUT = 300  # 5 minutes
    
    @classmethod
    def get_stats(cls) -> dict:
        """Get general dashboard statistics"""
        # ✅ Use standardized cache key from StatisticsCacheKeys
        cache_key = StatisticsCacheKeys.dashboard()
        data = cache.get(cache_key)
        if not data:
            data = cls._calculate_stats()
            cache.set(cache_key, data, cls.CACHE_TIMEOUT)
        return data
    
    @classmethod
    def _calculate_stats(cls) -> dict:
        """
        Calculate dashboard statistics
        Optimized: Each count() is a single query - no N+1 issues
        Total: 6 queries (users, admins, portfolios, media types x4, posts)
        """
        # ✅ Media count - 4 separate queries (different tables)
        # This is optimal since ImageMedia, VideoMedia, AudioMedia, DocumentMedia
        # are stored in separate tables (db_table='media_images', etc.)
        # Django optimizes count() automatically - no need for .only()
        total_media = (
            ImageMedia.objects.count() +
            VideoMedia.objects.count() +
            AudioMedia.objects.count() +
            DocumentMedia.objects.count()
        )
        
        # ✅ User counts - Single query each with proper filtering
        # Django optimizes count() automatically - executes COUNT(*) SQL
        # Regular users: user_type='user' AND is_staff=False
        total_users = User.objects.filter(
            user_type='user',
            is_staff=False
        ).count()
        
        # Admin users: user_type='admin' AND is_staff=True AND is_admin_active=True
        total_admins = User.objects.filter(
            user_type='admin',
            is_staff=True,
            is_admin_active=True
        ).count()
        
        # ✅ Portfolio count - Single query (Django optimizes automatically)
        total_portfolios = Portfolio.objects.count()
        
        # ✅ Portfolio categories, tags, options - Single queries each
        total_portfolio_categories = PortfolioCategory.objects.count()
        total_portfolio_tags = PortfolioTag.objects.count()
        total_portfolio_options = PortfolioOption.objects.count()
        
        # ✅ Blog posts count - Single query (Django optimizes automatically)
        total_posts = Blog.objects.count()
        
        # ✅ Blog categories, tags - Single queries each
        total_blog_categories = BlogCategory.objects.count()
        total_blog_tags = BlogTag.objects.count()
        
        # ✅ Email counts - Single queries with proper filtering
        # Uses index: email_messages_status_created_idx
        # Total emails: Include all emails (including drafts for accurate count)
        total_emails = EmailMessage.objects.count()
        new_emails = EmailMessage.objects.filter(status='new').count()
        # Unanswered emails (not replied and not draft) - same logic as EmailStatsService
        # Exclude drafts from unanswered count (drafts are not real emails)
        unanswered_emails = EmailMessage.objects.filter(
            ~Q(status='replied') & ~Q(status='draft')
        ).count()
        
        # ✅ Ticket counts - Single queries with proper filtering
        # Uses index: ticket_status_created_idx
        total_tickets = Ticket.objects.count()
        open_tickets = Ticket.objects.filter(status='open').count()
        in_progress_tickets = Ticket.objects.filter(status='in_progress').count()
        # Active tickets (open + in_progress)
        active_tickets = open_tickets + in_progress_tickets
        # Unanswered tickets (no messages - last_replied_at is null)
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
        """Clear dashboard cache"""
        # ✅ Use Cache Manager for standardized cache invalidation
        StatisticsCacheManager.invalidate_dashboard()

