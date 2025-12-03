from django.db.models import Count, Q
from src.portfolio.models.category import PortfolioCategory
from src.portfolio.models.portfolio import Portfolio


class PortfolioCategoryPublicService:
    @staticmethod
    def get_category_queryset(filters=None, search=None):
        queryset = PortfolioCategory.objects.filter(
            is_active=True
        ).annotate(
            portfolio_count=Count('portfolios', filter=Q(portfolios__is_active=True, portfolios__is_public=True))
        ).filter(
            portfolio_count__gt=0
        )
        
        if filters:
            if filters.get('name'):
                queryset = queryset.filter(name__icontains=filters['name'])
            if filters.get('parent_slug'):
                queryset = queryset.filter(parent__slug=filters['parent_slug'])
            if filters.get('depth'):
                queryset = queryset.filter(depth=filters['depth'])
            if filters.get('min_portfolio_count'):
                queryset = queryset.filter(portfolio_count__gte=filters['min_portfolio_count'])
        
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(description__icontains=search)
            )
        
        return queryset.order_by('-portfolio_count', 'name')
    
    @staticmethod
    def get_category_by_slug(slug):
        return PortfolioCategory.objects.filter(
            slug=slug, 
            is_active=True
        ).annotate(
            portfolio_count=Count('portfolios', filter=Q(portfolios__is_active=True, portfolios__is_public=True))
        ).first()
    
    @staticmethod
    def get_tree_data():
        return PortfolioCategory.objects.filter(
            is_active=True
        ).annotate(
            portfolio_count=Count('portfolios', filter=Q(portfolios__is_active=True, portfolios__is_public=True))
        ).filter(
            portfolio_count__gt=0
        ).order_by('path')
    
    @staticmethod
    def get_root_categories():
        return PortfolioCategory.objects.filter(
            is_active=True,
            depth=1
        ).annotate(
            portfolio_count=Count('portfolios', filter=Q(portfolios__is_active=True, portfolios__is_public=True))
        ).filter(
            portfolio_count__gt=0
        ).order_by('sort_order', 'name')

