from django.db.models import Q, Prefetch
from django.core.cache import cache
from src.portfolio.models.portfolio import Portfolio
from src.portfolio.models.media import PortfolioImage
from src.portfolio.utils.cache import PortfolioCacheKeys

class PortfolioPublicService:
    @staticmethod
    def get_portfolio_queryset(filters=None, search=None):
        cache_key = f"portfolio_public_list:{filters}:{search}"
        cached_result = cache.get(cache_key)
        if cached_result is not None:
            return cached_result
        
        queryset = Portfolio.objects.filter(
            is_active=True,
            is_public=True
        ).select_related(
            'created_by'
        ).prefetch_related(
            'categories',
            'tags',
            'options',
            Prefetch(
                'images',
                queryset=PortfolioImage.objects.filter(
                    is_main=True
                ).select_related('image')
            )
        )
        
        if filters:
            if filters.get('category_slug'):
                queryset = queryset.filter(categories__slug=filters['category_slug'])
            if filters.get('is_featured') is not None:
                queryset = queryset.filter(is_featured=filters['is_featured'])
            if filters.get('tag_slug'):
                queryset = queryset.filter(tags__slug=filters['tag_slug'])
        
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) |
                Q(short_description__icontains=search) |
                Q(description__icontains=search) |
                Q(categories__name__icontains=search) |
                Q(tags__name__icontains=search)
            ).distinct()
        
        queryset = queryset.order_by('-created_at')
        cache.set(cache_key, queryset, 300)
        return queryset
    
    @staticmethod
    def get_portfolio_by_slug(slug):
        cache_key = PortfolioCacheKeys.portfolio(f"public_slug_{slug}")
        cached_portfolio = cache.get(cache_key)
        if cached_portfolio is not None:
            return cached_portfolio
        
        portfolio = Portfolio.objects.filter(
            slug=slug,
            is_active=True,
            is_public=True
        ).select_related(
            'created_by', 'og_image'
        ).prefetch_related(
            'categories',
            'tags',
            'options',
            'images__image',
            'videos__video',
            'audios__audio',
            'documents__document'
        ).first()
        
        if portfolio:
            cache.set(cache_key, portfolio, 600)
        return portfolio
    
    @staticmethod
    def get_portfolio_by_public_id(public_id):
        cache_key = PortfolioCacheKeys.portfolio(f"public_id_{public_id}")
        cached_portfolio = cache.get(cache_key)
        if cached_portfolio is not None:
            return cached_portfolio
        
        portfolio = Portfolio.objects.filter(
            public_id=public_id,
            is_active=True,
            is_public=True
        ).select_related(
            'created_by', 'og_image'
        ).prefetch_related(
            'categories',
            'tags',
            'options',
            'images__image',
            'videos__video',
            'audios__audio',
            'documents__document'
        ).first()
        
        if portfolio:
            cache.set(cache_key, portfolio, 600)
        return portfolio
    
    @staticmethod
    def get_featured_portfolios(limit=6):
        cache_key = f"portfolio_public_featured_{limit}"
        cached_result = cache.get(cache_key)
        if cached_result is not None:
            return cached_result
        
        portfolios = Portfolio.objects.filter(
            is_active=True,
            is_public=True,
            is_featured=True
        ).select_related(
            'created_by'
        ).prefetch_related(
            'categories',
            Prefetch(
                'images',
                queryset=PortfolioImage.objects.filter(
                    is_main=True
                ).select_related('image')
            )
        ).order_by('-created_at')[:limit]
        
        cache.set(cache_key, portfolios, 300)
        return portfolios
    
    @staticmethod
    def get_related_portfolios(portfolio, limit=4):
        cache_key = f"portfolio_public_related_{portfolio.id}_{limit}"
        cached_result = cache.get(cache_key)
        if cached_result is not None:
            return cached_result
        
        category_ids = portfolio.categories.values_list('id', flat=True)
        portfolios = Portfolio.objects.filter(
            is_active=True,
            is_public=True,
            categories__id__in=category_ids
        ).exclude(
            id=portfolio.id
        ).select_related(
            'created_by'
        ).prefetch_related(
            'categories',
            Prefetch(
                'images',
                queryset=PortfolioImage.objects.filter(
                    is_main=True
                ).select_related('image')
            )
        ).distinct().order_by('-created_at')[:limit]
        
        cache.set(cache_key, portfolios, 300)
        return portfolios