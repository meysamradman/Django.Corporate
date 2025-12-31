import django_filters
from django.db.models import Q, Count
from src.portfolio.models.tag import PortfolioTag


class PortfolioTagAdminFilter(django_filters.FilterSet):
    search = django_filters.CharFilter(method='filter_search', label='Search')
    is_active = django_filters.BooleanFilter(field_name='is_active', label='Active Status')
    usage = django_filters.ChoiceFilter(
        method='filter_usage',
        choices=[
            ('used', 'Used'),
            ('unused', 'Unused'),
            ('popular', 'Popular (More than 5 portfolios)')
        ],
        label='Usage Status'
    )
    portfolio_count_min = django_filters.NumberFilter(
        method='filter_portfolio_count_min',
        label='Min Portfolio Count'
    )
    portfolio_count_max = django_filters.NumberFilter(
        method='filter_portfolio_count_max',
        label='Max Portfolio Count'
    )
    created_after = django_filters.DateFilter(
        field_name='created_at',
        lookup_expr='gte',
        label='Created After'
    )
    created_before = django_filters.DateFilter(
        field_name='created_at',
        lookup_expr='lte',
        label='Created Before'
    )
    date_from = django_filters.DateFilter(
        field_name='created_at__date',
        lookup_expr='gte',
        label='Filter from this date'
    )
    date_to = django_filters.DateFilter(
        field_name='created_at__date',
        lookup_expr='lte',
        label='Filter to this date'
    )
    name_length = django_filters.ChoiceFilter(
        method='filter_name_length',
        choices=[
            ('short', 'Short (Less than 10 characters)'),
            ('medium', 'Medium (10-20 characters)'),
            ('long', 'Long (More than 20 characters)')
        ],
        label='Name Length'
    )
    
    class Meta:
        model = PortfolioTag
        fields = []
    
    def filter_search(self, queryset, name, value):
        if not value:
            return queryset
        
        return queryset.filter(
            Q(name__icontains=value) |
            Q(description__icontains=value) |
            Q(slug__icontains=value)
        )
    
    def filter_usage(self, queryset, name, value):
        if not value:
            return queryset
        
        if value == 'used':
            return queryset.filter(portfolio_tags__isnull=False).distinct()
        elif value == 'unused':
            return queryset.filter(portfolio_tags__isnull=True)
        elif value == 'popular':
            return queryset.annotate(
                usage_count=Count('portfolio_tags')
            ).filter(usage_count__gte=5)
        
        return queryset
    
    def filter_portfolio_count_min(self, queryset, name, value):
        if value is None:
            return queryset
        
        return queryset.annotate(
            usage_count=Count('portfolio_tags')
        ).filter(usage_count__gte=value)
    
    def filter_portfolio_count_max(self, queryset, name, value):
        if value is None:
            return queryset
        
        return queryset.annotate(
            usage_count=Count('portfolio_tags')
        ).filter(usage_count__lte=value)
    
    def filter_name_length(self, queryset, name, value):
        if not value:
            return queryset
        
        if value == 'short':
            return queryset.extra(where=["CHAR_LENGTH(name) < 10"])
        elif value == 'medium':
            return queryset.extra(where=["CHAR_LENGTH(name) BETWEEN 10 AND 20"])
        elif value == 'long':
            return queryset.extra(where=["CHAR_LENGTH(name) > 20"])
        
        return queryset
