import django_filters
from django.db.models import Q, Count
from src.real_estate.models.label import PropertyLabel


class PropertyLabelAdminFilter(django_filters.FilterSet):
    search = django_filters.CharFilter(method='filter_search', label='Search')
    is_active = django_filters.BooleanFilter(field_name='is_active', label='Active Status')
    
    color = django_filters.CharFilter(
        field_name='color',
        lookup_expr='iexact',
        label='Label Color'
    )
    
    usage = django_filters.ChoiceFilter(
        method='filter_usage',
        choices=[
            ('used', 'Used'),
            ('unused', 'Unused'),
            ('popular', 'Popular (More than 5 properties)')
        ],
        label='Usage Status'
    )
    
    property_count_min = django_filters.NumberFilter(
        method='filter_property_count_min',
        label='Min Property Count'
    )
    
    property_count_max = django_filters.NumberFilter(
        method='filter_property_count_max',
        label='Max Property Count'
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
    
    class Meta:
        model = PropertyLabel
        fields = []
    
    def filter_search(self, queryset, name, value):
        if not value:
            return queryset
        
        return queryset.filter(
            Q(title__icontains=value) |
            Q(description__icontains=value)
        )
    
    def filter_usage(self, queryset, name, value):
        if not value:
            return queryset
        
        if value == 'used':
            return queryset.filter(properties__isnull=False).distinct()
        elif value == 'unused':
            return queryset.filter(properties__isnull=True)
        elif value == 'popular':
            return queryset.annotate(
                usage_count=Count('properties')
            ).filter(usage_count__gte=5)
        
        return queryset
    
    def filter_property_count_min(self, queryset, name, value):
        if value is None:
            return queryset
        
        return queryset.annotate(
            usage_count=Count('properties')
        ).filter(usage_count__gte=value)
    
    def filter_property_count_max(self, queryset, name, value):
        if value is None:
            return queryset
        
        return queryset.annotate(
            usage_count=Count('properties')
        ).filter(usage_count__lte=value)
