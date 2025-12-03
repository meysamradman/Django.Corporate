import django_filters
from django.db.models import Q, Count
from src.portfolio.models.option import PortfolioOption


class PortfolioOptionAdminFilter(django_filters.FilterSet):
    search = django_filters.CharFilter(method='filter_search', label='جستجو')
    is_active = django_filters.BooleanFilter(field_name='is_active', label='وضعیت فعال')
    is_public = django_filters.BooleanFilter(field_name='is_public', label='وضعیت عمومی')
    name = django_filters.CharFilter(field_name='name', lookup_expr='icontains', label='نام')
    name_exact = django_filters.CharFilter(field_name='name', lookup_expr='exact', label='نام دقیق')
    usage = django_filters.ChoiceFilter(
        method='filter_usage',
        choices=[
            ('used', 'استفاده شده'),
            ('unused', 'استفاده نشده'),
            ('popular', 'محبوب (بیش از 3 نمونه کار)')
        ],
        label='وضعیت استفاده'
    )
    portfolio_count_min = django_filters.NumberFilter(
        method='filter_portfolio_count_min',
        label='حداقل تعداد نمونه کار'
    )
    portfolio_count_max = django_filters.NumberFilter(
        method='filter_portfolio_count_max',
        label='حداکثر تعداد نمونه کار'
    )
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
        if not value:
            return queryset
        
        return queryset.filter(
            Q(name__icontains=value) |
            Q(description__icontains=value)
        )
    
    def filter_usage(self, queryset, name, value):
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
        if value is None:
            return queryset
        
        return queryset.annotate(
            usage_count=Count('portfolio_options')
        ).filter(usage_count__gte=value)
    
    def filter_portfolio_count_max(self, queryset, name, value):
        if value is None:
            return queryset
        
        return queryset.annotate(
            usage_count=Count('portfolio_options')
        ).filter(usage_count__lte=value)
