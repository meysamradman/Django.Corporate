from django.db.models import Q, Prefetch
from src.portfolio.models.portfolio import Portfolio
from src.portfolio.models.media import PortfolioImage


class PortfolioPublicService:
    @staticmethod
    def get_portfolio_queryset(filters=None, search=None):
        """Get optimized queryset for public portfolio listing"""
        queryset = Portfolio.objects.filter(
            is_active=True,
            is_public=True
        ).select_related(
            'created_by'
        ).prefetch_related(
            'categories',
            'tags',
            'portfolio_options',
            Prefetch(
                'images',
                queryset=PortfolioImage.objects.filter(
                    is_main=True
                ).select_related('image')
            )
        )
        
        # Apply filters
        if filters:
            if filters.get('category_slug'):
                queryset = queryset.filter(categories__slug=filters['category_slug'])
            if filters.get('is_featured') is not None:
                queryset = queryset.filter(is_featured=filters['is_featured'])
            if filters.get('tag_slug'):
                queryset = queryset.filter(tags__slug=filters['tag_slug'])
        
        # Apply search
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) |
                Q(short_description__icontains=search) |
                Q(description__icontains=search) |
                Q(categories__name__icontains=search) |
                Q(tags__name__icontains=search)
            ).distinct()
        
        return queryset.order_by('-is_featured', '-created_at')
    
    @staticmethod
    def get_portfolio_by_slug(slug):
        """Get single portfolio by slug with full data"""
        return Portfolio.objects.filter(
            slug=slug,
            is_active=True,
            is_public=True
        ).select_related(
            'created_by', 'og_image'
        ).prefetch_related(
            'categories',
            'tags',
            'portfolio_options',
            'images__image',
            'videos__video',
            'audios__audio',
            'documents__document'
        ).first()
        
    @staticmethod
    def get_portfolio_by_public_id(public_id):
        """Get single portfolio by public_id with full data"""
        return Portfolio.objects.filter(
            public_id=public_id,
            is_active=True,
            is_public=True
        ).select_related(
            'created_by', 'og_image'
        ).prefetch_related(
            'categories',
            'tags',
            'portfolio_options',
            'images__image',
            'videos__video',
            'audios__audio',
            'documents__document'
        ).first()
    
    @staticmethod
    def get_featured_portfolios(limit=6):
        """Get featured portfolios for homepage"""
        return Portfolio.objects.filter(
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
    
    @staticmethod
    def get_related_portfolios(portfolio, limit=4):
        """Get related portfolios based on categories"""
        category_ids = portfolio.categories.values_list('id', flat=True)
        return Portfolio.objects.filter(
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