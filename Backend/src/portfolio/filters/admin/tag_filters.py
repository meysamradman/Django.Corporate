import django_filters
from django.db.models import Q, Count
from src.portfolio.models.tag import PortfolioTag


class PortfolioTagAdminFilter(django_filters.FilterSet):
    """Advanced filtering for Portfolio Tags in admin panel"""
    
    # Text search in name and description
    search = django_filters.CharFilter(method='filter_search', label='جستجو')
    
    # Activity status
    is_active = django_filters.BooleanFilter(field_name='is_active', label='وضعیت فعال')
    
    # Usage filter
    usage = django_filters.ChoiceFilter(
        method='filter_usage',
        choices=[
            ('used', 'استفاده شده'),
            ('unused', 'استفاده نشده'),
            ('popular', 'محبوب (بیش از 5 نمونه کار)')
        ],
        label='وضعیت استفاده'
    )
    
    # Portfolio count range
    portfolio_count_min = django_filters.NumberFilter(
        method='filter_portfolio_count_min',
        label='حداقل تعداد نمونه کار'
    )
    portfolio_count_max = django_filters.NumberFilter(
        method='filter_portfolio_count_max',
        label='حداکثر تعداد نمونه کار'
    )
    
    # Date filters
    created_after = django_filters.DateFilter(
        field_name='created_at',
        lookup_expr='gte',
        label='ایجاد شده بعد از'
    )
    created_before = django_filters.DateFilter(
        field_name='created_at',
        lookup_expr='lte',
        label='ایجاد شده قبل از'
    )
    
    # Name length filter
    name_length = django_filters.ChoiceFilter(
        method='filter_name_length',
        choices=[
            ('short', 'کوتاه (کمتر از 10 کاراکتر)'),
            ('medium', 'متوسط (10-20 کاراکتر)'),
            ('long', 'طولانی (بیش از 20 کاراکتر)')
        ],
        label='طول نام'
    )
    
    class Meta:
        model = PortfolioTag
        fields = []
    
    def filter_search(self, queryset, name, value):
        """Search in name, description"""
        if not value:
            return queryset
        
        return queryset.filter(
            Q(name__icontains=value) |
            Q(description__icontains=value) |
            Q(slug__icontains=value)
        )
    
    def filter_usage(self, queryset, name, value):
        """Filter by usage status"""
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
        """Filter by minimum portfolio count"""
        if value is None:
            return queryset
        
        return queryset.annotate(
            usage_count=Count('portfolio_tags')
        ).filter(usage_count__gte=value)
    
    def filter_portfolio_count_max(self, queryset, name, value):
        """Filter by maximum portfolio count"""
        if value is None:
            return queryset
        
        return queryset.annotate(
            usage_count=Count('portfolio_tags')
        ).filter(usage_count__lte=value)
    
    def filter_name_length(self, queryset, name, value):
        """Filter by name length"""
        if not value:
            return queryset
        
        if value == 'short':
            return queryset.extra(where=["CHAR_LENGTH(name) < 10"])
        elif value == 'medium':
            return queryset.extra(where=["CHAR_LENGTH(name) BETWEEN 10 AND 20"])
        elif value == 'long':
            return queryset.extra(where=["CHAR_LENGTH(name) > 20"])
        
        return queryset
