from django_filters import rest_framework as filters
from src.portfolio.models.option import PortfolioOption


class PortfolioOptionPublicFilter(filters.FilterSet):
    """Public option filters for website"""
    
    key = filters.CharFilter(
        field_name='key',
        lookup_expr='icontains',
        help_text='Filter by option key'
    )
    
    value = filters.CharFilter(
        field_name='value',
        lookup_expr='icontains',
        help_text='Filter by option value'
    )
    
    min_portfolio_count = filters.NumberFilter(
        field_name='portfolio_count',
        lookup_expr='gte',
        help_text='Minimum portfolio count'
    )
    
    class Meta:
        model = PortfolioOption
        fields = ['key', 'value', 'min_portfolio_count']
