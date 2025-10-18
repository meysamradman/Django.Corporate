import django_filters
from django.db.models import Q, Count
from src.portfolio.models.option import PortfolioOption


class PortfolioOptionAdminFilter(django_filters.FilterSet):
    """Advanced filtering for Portfolio Options in admin panel"""
    
    # Text search in name and description
    search = django_filters.CharFilter(method='filter_search', label='جستجو')
    
    # Activity status
    is_active = django_filters.BooleanFilter(field_name='is_active', label='وضعیت فعال')
    
    # Public status
    is_public = django_filters.BooleanFilter(field_name='is_public', label='وضعیت عمومی')
    
    # Name filter
    name = django_filters.CharFilter(field_name='name', lookup_expr='icontains', label='نام')
    name_exact = django_filters.CharFilter(field_name='name', lookup_expr='exact', label='نام دقیق')
    
    # Usage filter
    usage = django_filters.ChoiceFilter(
        method='filter_usage',
        choices=[
            ('used', 'استفاده شده'),
            ('unused', 'استفاده نشده'),
            ('popular', 'محبوب (بیش از 3 نمونه کار)')
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
    
    class Meta:
        model = PortfolioOption
        fields = []
    
    def filter_search(self, queryset, name, value):
        """Search in name, description"""
        if not value:
            return queryset
        
        return queryset.filter(
            Q(name__icontains=value) |
            Q(description__icontains=value)
        )
    
    def filter_usage(self, queryset, name, value):
        """Filter by usage status"""
        if not value:
            return queryset
        
        if value == 'used':
            return queryset.filter(portfolio_options__isnull=False).distinct()
        elif value == 'unused':
            return queryset.filter(portfolio_options__isnull=True)
        elif value == 'popular':
            return queryset.annotate(
                usage_count=Count('portfolio_options')
            ).filter(usage_count__gte=3)
        
        return queryset
    
    def filter_portfolio_count_min(self, queryset, name, value):
        """Filter by minimum portfolio count"""
        if value is None:
            return queryset
        
        return queryset.annotate(
            usage_count=Count('portfolio_options')
        ).filter(usage_count__gte=value)
    
    def filter_portfolio_count_max(self, queryset, name, value):
        """Filter by maximum portfolio count"""
        if value is None:
            return queryset
        
        return queryset.annotate(
            usage_count=Count('portfolio_options')
        ).filter(usage_count__lte=value)
