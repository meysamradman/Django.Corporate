from django_filters import rest_framework as filters
from src.portfolio.models.option import PortfolioOption

class PortfolioOptionPublicFilter(filters.FilterSet):
    name = filters.CharFilter(
        field_name='name',
        lookup_expr='icontains',
        help_text='Filter by option name'
    )
    
    min_portfolio_count = filters.NumberFilter(
        field_name='portfolio_count',
        lookup_expr='gte',
        help_text='Minimum portfolio count'
    )
    
    class Meta:
        model = PortfolioOption
        fields = ['name', 'min_portfolio_count']
