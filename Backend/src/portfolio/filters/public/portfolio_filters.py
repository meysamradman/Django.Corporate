from django_filters import rest_framework as filters
from src.portfolio.models.portfolio import Portfolio


class PortfolioPublicFilter(filters.FilterSet):
    """Public portfolio filters for website"""
    
    category_slug = filters.CharFilter(
        field_name='categories__slug',
        lookup_expr='exact',
        help_text='Filter by category slug'
    )
    
    tag_slug = filters.CharFilter(
        field_name='tags__slug',
        lookup_expr='exact',
        help_text='Filter by tag slug'
    )
    
    is_featured = filters.BooleanFilter(
        field_name='is_featured',
        help_text='Filter featured portfolios'
    )
    
    created_after = filters.DateFilter(
        field_name='created_at',
        lookup_expr='gte',
        help_text='Filter portfolios created after this date'
    )
    
    created_before = filters.DateFilter(
        field_name='created_at',
        lookup_expr='lte',
        help_text='Filter portfolios created before this date'
    )
    
    class Meta:
        model = Portfolio
        fields = [
            'category_slug',
            'tag_slug', 
            'is_featured',
            'created_after',
            'created_before'
        ]
