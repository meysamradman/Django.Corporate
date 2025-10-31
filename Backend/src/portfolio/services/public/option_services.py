from django.db.models import Count, Q
from src.portfolio.models.option import PortfolioOption
from src.portfolio.models.portfolio import Portfolio


class PortfolioOptionPublicService:
    @staticmethod
    def get_option_queryset(filters=None, search=None):
        """Get optimized queryset for public option listing"""
        queryset = PortfolioOption.objects.filter(
            is_active=True
        ).annotate(
            portfolio_count=Count('portfolios', filter=Q(portfolios__is_active=True, portfolios__is_public=True))
        ).filter(
            portfolio_count__gt=0  # Only show options with active portfolios
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
                Q(slug__icontains=search) |
                Q(description__icontains=search)
            )
        
        return queryset.order_by('-portfolio_count', 'name')
    
    @staticmethod
    def get_option_by_slug(slug):
        """Get option by slug with portfolio count"""
        return PortfolioOption.objects.filter(
            slug=slug, 
            is_active=True
        ).annotate(
            portfolio_count=Count('portfolios', filter=Q(portfolios__is_active=True, portfolios__is_public=True))
        ).first()
    
    @staticmethod
    def get_options_by_name(name, limit=10):
        """Get options by name for filtering"""
        return PortfolioOption.objects.filter(
            name=name,
            is_active=True
        ).annotate(
            portfolio_count=Count('portfolio_options', filter=Q(portfolio_options__is_active=True, portfolio_options__is_public=True))
        ).filter(
            portfolio_count__gt=0
        ).order_by('-portfolio_count', 'name')[:limit]

