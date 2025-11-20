"""
Dashboard Statistics Service - General overview stats
No permission required - available to all admins (BASE_ADMIN_PERMISSIONS)
"""
from django.core.cache import cache
from django.utils import timezone
from django.contrib.auth import get_user_model
from src.portfolio.models.portfolio import Portfolio
from src.blog.models.blog import Blog
from src.media.models.media import ImageMedia, VideoMedia, AudioMedia, DocumentMedia

User = get_user_model()


class DashboardStatsService:
    """
    General dashboard statistics - Non-sensitive data only
    Optimized to avoid N+1 queries - all counts use single queries
    """
    CACHE_KEY = 'admin_stats_dashboard_overview'
    CACHE_TIMEOUT = 300  # 5 minutes
    
    @classmethod
    def get_stats(cls) -> dict:
        """Get general dashboard statistics"""
        data = cache.get(cls.CACHE_KEY)
        if not data:
            data = cls._calculate_stats()
            cache.set(cls.CACHE_KEY, data, cls.CACHE_TIMEOUT)
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
        
        # ✅ Blog posts count - Single query (Django optimizes automatically)
        total_posts = Blog.objects.count()
        
        return {
            'total_users': total_users,
            'total_admins': total_admins,
            'total_portfolios': total_portfolios,
            'total_media': total_media,
            'total_posts': total_posts,
            'generated_at': timezone.now().isoformat(),
        }
    
    @classmethod
    def clear_cache(cls):
        """Clear dashboard cache"""
        cache.delete(cls.CACHE_KEY)

