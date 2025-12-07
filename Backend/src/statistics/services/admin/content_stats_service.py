from django.apps import apps
from django.core.cache import cache
from django.utils import timezone
from src.statistics.utils.cache import StatisticsCacheKeys, StatisticsCacheManager


class ContentStatsService:
    CACHE_TIMEOUT = 300
    REQUIRED_PERMISSION = 'statistics.content.read'
    
    @classmethod
    def get_stats(cls) -> dict:
        cache_key = StatisticsCacheKeys.content()
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
        
        if apps.is_installed('src.portfolio'):
            from src.portfolio.models.portfolio import Portfolio
            from src.portfolio.models.category import PortfolioCategory
            
            stats['portfolios'] = {
                'total': Portfolio.objects.count(),
                'published': Portfolio.objects.filter(is_published=True).count(),
                'categories': PortfolioCategory.objects.count(),
            }
        else:
            stats['portfolios'] = {
                'total': 0,
                'published': 0,
                'categories': 0,
            }
        
        if apps.is_installed('src.blog'):
            from src.blog.models.blog import Blog
            from src.blog.models.category import BlogCategory
            
            stats['blog'] = {
                'total': Blog.objects.count(),
                'published': Blog.objects.filter(is_published=True).count(),
                'categories': BlogCategory.objects.count(),
            }
        else:
            stats['blog'] = {
                'total': 0,
                'published': 0,
                'categories': 0,
            }
        
        if apps.is_installed('src.media'):
            from src.media.models.media import ImageMedia, VideoMedia, AudioMedia, DocumentMedia
            
            total_media = (
                ImageMedia.objects.count() +
                VideoMedia.objects.count() +
                AudioMedia.objects.count() +
                DocumentMedia.objects.count()
            )
            
            stats['media'] = {
                'total': total_media,
                'images': ImageMedia.objects.count(),
                'videos': VideoMedia.objects.count(),
                'audios': AudioMedia.objects.count(),
                'documents': DocumentMedia.objects.count(),
            }
        else:
            stats['media'] = {
                'total': 0,
                'images': 0,
                'videos': 0,
                'audios': 0,
                'documents': 0,
            }
        
        return stats
    
    @classmethod
    def clear_cache(cls):
        StatisticsCacheManager.invalidate_content()

