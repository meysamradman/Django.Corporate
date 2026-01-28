from django_filters import rest_framework as filters
from src.portfolio.models.category import PortfolioCategory

class PortfolioCategoryPublicFilter(filters.FilterSet):
    name = filters.CharFilter(
        field_name='name',
        lookup_expr='icontains',
        help_text='Filter by category name'
    )
    
    parent_slug = filters.CharFilter(
        field_name='parent__slug',
        lookup_expr='exact',
        help_text='Filter by parent category slug'
    )
    
    min_portfolio_count = filters.NumberFilter(
        field_name='portfolio_count',
        lookup_expr='gte',
        help_text='Minimum portfolio count'
    )
    
    depth = filters.NumberFilter(
        field_name='depth',
        lookup_expr='exact',
        help_text='Filter by category depth level'
    )
    
    class Meta:
        model = PortfolioCategory
        fields = ['name', 'parent_slug', 'min_portfolio_count', 'depth']
