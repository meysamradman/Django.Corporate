from django_filters import rest_framework as filters
from src.portfolio.models.tag import PortfolioTag


class PortfolioTagPublicFilter(filters.FilterSet):
    name = filters.CharFilter(
        field_name='name',
        lookup_expr='icontains',
        help_text='Filter by tag name'
    )
    
    min_portfolio_count = filters.NumberFilter(
        field_name='portfolio_count',
        lookup_expr='gte',
        help_text='Minimum portfolio count'
    )
    
    class Meta:
        model = PortfolioTag
        fields = ['name', 'min_portfolio_count']
