import django_filters
from django.db.models import Q, Count
from src.real_estate.models.type import PropertyType

class PropertyTypeAdminFilter(django_filters.FilterSet):
    search = django_filters.CharFilter(method='filter_search', label='Search')
    is_active = django_filters.BooleanFilter(field_name='is_active', label='Active Status')
    
    level = django_filters.NumberFilter(field_name='depth', label='Tree Level')
    level_min = django_filters.NumberFilter(field_name='depth', lookup_expr='gte', label='Min Level')
    level_max = django_filters.NumberFilter(field_name='depth', lookup_expr='lte', label='Max Level')
    
    parent = django_filters.ModelChoiceFilter(
        method='filter_parent',
        queryset=PropertyType.objects.filter(is_active=True),
        label='Parent Type'
    )
    
    is_root = django_filters.BooleanFilter(method='filter_root', label='Root Types Only')
    
    has_children = django_filters.BooleanFilter(method='filter_has_children', label='Has Children')
    
    usage = django_filters.ChoiceFilter(
        method='filter_usage',
        choices=[
            ('used', 'Used'),
            ('unused', 'Unused'),
            ('popular', 'Popular (More than 10 properties)')
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
        model = PropertyType
        fields = []
    
    def filter_search(self, queryset, name, value):
        if not value:
            return queryset
        
        return queryset.filter(
            Q(title__icontains=value) |
            Q(description__icontains=value) |
            Q(slug__icontains=value)
        )
    
    def filter_parent(self, queryset, name, value):
        if not value:
            return queryset
        descendants = value.get_descendants(include_self=True)
        return queryset.filter(id__in=descendants.values_list('id', flat=True))
    
    def filter_root(self, queryset, name, value):
        if value is None:
            return queryset
        
        if value:
            return queryset.filter(depth=1)
        else:
            return queryset.filter(depth__gt=1)
    
    def filter_has_children(self, queryset, name, value):
        if value is None:
            return queryset
        
        if value:
            return queryset.annotate(
                children_count=Count('children')
            ).filter(children_count__gt=0)
        else:
            return queryset.annotate(
                children_count=Count('children')
            ).filter(children_count=0)
    
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
            ).filter(usage_count__gte=10)
        
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
