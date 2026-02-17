from django.apps import apps
from django.core.cache import cache
from django.utils import timezone
from src.analytics.utils.cache import AnalyticsCacheKeys, AnalyticsCacheManager

class ContentStatsService:
    CACHE_TIMEOUT = 300
    REQUIRED_PERMISSION = 'analytics.content.read'
    
    @classmethod
    def get_stats(cls) -> dict:
        cache_key = AnalyticsCacheKeys.content()
        data = cache.get(cache_key)
        if not data:
            data = cls._calculate_stats()
            cache.set(cache_key, data, cls.CACHE_TIMEOUT)
        return data
    
    @classmethod
    def get_monthly_trend(cls) -> dict:
        cache_key = AnalyticsCacheKeys.content_trend()
        data = cache.get(cache_key)
        if not data:
            data = cls._calculate_monthly_trend()
            cache.set(cache_key, data, cls.CACHE_TIMEOUT)
        return data

    @classmethod
    def _calculate_monthly_trend(cls) -> list:
        from datetime import date, timedelta
        from django.db.models.functions import TruncMonth
        from django.db.models import Count
        
        now = timezone.now()
        trends = []
        
        for i in range(5, -1, -1):
            month_date = now.date() - timedelta(days=30 * i)
            start_date = month_date.replace(day=1)
            
            gregorian_month = start_date.month
            approximate_jalali_month = ((gregorian_month + 1) % 12) + 1
            persian_month_names = [
                'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
                'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
            ]
            month_name = persian_month_names[approximate_jalali_month - 1]

            month_data = {
                'month': month_name,
                'properties': 0,
                'sale_properties': 0,
                'rent_properties': 0,
                'inquiries': 0,
                'agents': 0
            }

            if apps.is_installed('src.real_estate'):
                from src.real_estate.models.property import Property
                from src.real_estate.models.statistics import PropertyInquiry
                from src.real_estate.models.agent import PropertyAgent
                
                month_data['properties'] = Property.objects.filter(
                    created_at__year=start_date.year,
                    created_at__month=start_date.month
                ).count()
                
                month_data['sale_properties'] = Property.objects.filter(
                    state__slug='sale',
                    created_at__year=start_date.year,
                    created_at__month=start_date.month
                ).count()
                
                month_data['rent_properties'] = Property.objects.filter(
                    state__slug='rent',
                    created_at__year=start_date.year,
                    created_at__month=start_date.month
                ).count()
                
                month_data['inquiries'] = PropertyInquiry.objects.filter(
                    created_at__year=start_date.year,
                    created_at__month=start_date.month
                ).count()
                
                month_data['agents'] = PropertyAgent.objects.filter(
                    created_at__year=start_date.year,
                    created_at__month=start_date.month
                ).count()
            
            trends.append(month_data)
            
        return trends

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
        AnalyticsCacheManager.invalidate_content()
        AnalyticsCacheManager.invalidate_content_trend()

