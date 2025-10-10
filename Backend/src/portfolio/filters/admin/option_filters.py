import django_filters
from django.db.models import Q, Count
from src.portfolio.models.option import PortfolioOption


class PortfolioOptionAdminFilter(django_filters.FilterSet):
    """Advanced filtering for Portfolio Options in admin panel"""
    
    # Text search in key, value, and description
    search = django_filters.CharFilter(method='filter_search', label='جستجو')
    
    # Activity status
    is_active = django_filters.BooleanFilter(field_name='is_active', label='وضعیت فعال')
    
    # Key filter
    key = django_filters.CharFilter(field_name='key', lookup_expr='icontains', label='کلید')
    key_exact = django_filters.CharFilter(field_name='key', lookup_expr='exact', label='کلید دقیق')
    
    # Value filter
    value = django_filters.CharFilter(field_name='value', lookup_expr='icontains', label='مقدار')
    
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
    
    # Key type filter (common key patterns)
    key_type = django_filters.ChoiceFilter(
        method='filter_key_type',
        choices=[
            ('tech', 'فناوری (technology، framework، language)'),
            ('size', 'اندازه (size، dimension، scale)'),
            ('color', 'رنگ (color، theme، style)'),
            ('status', 'وضعیت (status، state، condition)'),
            ('category', 'دسته‌بندی (category، type، kind)')
        ],
        label='نوع کلید'
    )
    
    # Duplicate detection
    has_duplicates = django_filters.BooleanFilter(
        method='filter_duplicates',
        label='گزینه‌های تکراری'
    )
    
    class Meta:
        model = PortfolioOption
        fields = []
    
    def filter_search(self, queryset, name, value):
        """Search in key, value, description"""
        if not value:
            return queryset
        
        return queryset.filter(
            Q(key__icontains=value) |
            Q(value__icontains=value) |
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
    
    def filter_key_type(self, queryset, name, value):
        """Filter by key type patterns"""
        if not value:
            return queryset
        
        patterns = {
            'tech': ['technology', 'framework', 'language', 'tool', 'platform'],
            'size': ['size', 'dimension', 'scale', 'width', 'height'],
            'color': ['color', 'theme', 'style', 'design', 'palette'],
            'status': ['status', 'state', 'condition', 'phase', 'stage'],
            'category': ['category', 'type', 'kind', 'group', 'class']
        }
        
        if value in patterns:
            key_patterns = patterns[value]
            q_objects = Q()
            for pattern in key_patterns:
                q_objects |= Q(key__icontains=pattern)
            return queryset.filter(q_objects)
        
        return queryset
    
    def filter_duplicates(self, queryset, name, value):
        """Filter options that have duplicate key-value combinations"""
        if value is None:
            return queryset
        
        if value:
            # Find duplicate key-value combinations
            duplicate_combos = PortfolioOption.objects.values('key', 'value').annotate(
                count=Count('id')
            ).filter(count__gt=1)
            
            if duplicate_combos:
                q_objects = Q()
                for combo in duplicate_combos:
                    q_objects |= Q(key=combo['key'], value=combo['value'])
                return queryset.filter(q_objects)
            else:
                return queryset.none()
        else:
            # Find unique key-value combinations
            duplicate_combos = PortfolioOption.objects.values('key', 'value').annotate(
                count=Count('id')
            ).filter(count__gt=1)
            
            if duplicate_combos:
                q_objects = Q()
                for combo in duplicate_combos:
                    q_objects |= Q(key=combo['key'], value=combo['value'])
                return queryset.exclude(q_objects)
            else:
                return queryset
        
        return queryset
