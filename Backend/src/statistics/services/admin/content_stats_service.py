"""
Content Statistics Service - Portfolio, blog, media stats
Requires: statistics.content.read permission
"""
from django.core.cache import cache
from django.utils import timezone
from src.portfolio.models.portfolio import Portfolio
from src.portfolio.models.category import PortfolioCategory
from src.media.models.media import ImageMedia, VideoMedia, AudioMedia, DocumentMedia
from src.statistics.utils.cache import StatisticsCacheKeys, StatisticsCacheManager


class ContentStatsService:
    """
    Content statistics - Portfolio, blog, media, categories
    """
    CACHE_TIMEOUT = 300  # 5 minutes
    REQUIRED_PERMISSION = 'statistics.content.read'
    
    @classmethod
    def get_stats(cls) -> dict:
        """Get content statistics"""
        # ✅ Use standardized cache key from StatisticsCacheKeys
        cache_key = StatisticsCacheKeys.content()
        data = cache.get(cache_key)
        if not data:
            data = cls._calculate_stats()
            cache.set(cache_key, data, cls.CACHE_TIMEOUT)
        return data
    
    @classmethod
    def _calculate_stats(cls) -> dict:
        """Calculate content statistics"""
        total_media = (
            ImageMedia.objects.count() +
            VideoMedia.objects.count() +
            AudioMedia.objects.count() +
            DocumentMedia.objects.count()
        )
        
        return {
            'portfolios': {
                'total': Portfolio.objects.count(),
                'published': Portfolio.objects.filter(is_published=True).count(),
                'categories': PortfolioCategory.objects.count(),
            },
            'media': {
                'total': total_media,
                'images': ImageMedia.objects.count(),
                'videos': VideoMedia.objects.count(),
                'audios': AudioMedia.objects.count(),
                'documents': DocumentMedia.objects.count(),
            },
            'generated_at': timezone.now().isoformat(),
        }
    
    @classmethod
    def clear_cache(cls):
        """Clear content stats cache"""
        # ✅ Use Cache Manager for standardized cache invalidation
        StatisticsCacheManager.invalidate_content()

