from django.db.models import Count, Q
from src.portfolio.models.tag import PortfolioTag
from src.portfolio.models.portfolio import Portfolio


class PortfolioTagPublicService:
    @staticmethod
    def get_tag_queryset(filters=None, search=None):
        """Get optimized queryset for public tag listing"""
        queryset = PortfolioTag.objects.filter(
            is_active=True
        ).annotate(
            portfolio_count=Count('portfolios', filter=Q(portfolios__is_active=True, portfolios__is_public=True))
        ).filter(
            portfolio_count__gt=0  # Only show tags with active portfolios
        )
        
        # Apply filters
        if filters:
            if filters.get('name'):
                queryset = queryset.filter(name__icontains=filters['name'])
            if filters.get('min_portfolio_count'):
                queryset = queryset.filter(portfolio_count__gte=filters['min_portfolio_count'])
        
        # Apply search
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(description__icontains=search)
            )
        
        return queryset.order_by('-portfolio_count', 'name')
    
    @staticmethod
    def get_tag_by_slug(slug):
        """Get tag by slug with portfolio count"""
        return PortfolioTag.objects.filter(
            slug=slug, 
            is_active=True
        ).annotate(
            portfolio_count=Count('portfolios', filter=Q(portfolios__is_active=True, portfolios__is_public=True))
        ).first()
    
    @staticmethod
    def get_popular_tags(limit=10):
        """Get most popular tags"""
        return PortfolioTag.objects.filter(
            is_active=True
        ).annotate(
            portfolio_count=Count('portfolios', filter=Q(portfolios__is_active=True, portfolios__is_public=True))
        ).filter(
            portfolio_count__gt=0
        ).order_by('-portfolio_count', 'name')[:limit]

