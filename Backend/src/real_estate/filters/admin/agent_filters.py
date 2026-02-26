import django_filters
from django.db.models import Q, Count
from src.real_estate.models.agent import PropertyAgent

class PropertyAgentAdminFilter(django_filters.FilterSet):
    search = django_filters.CharFilter(method='filter_search', label='Search')
    is_active = django_filters.BooleanFilter(field_name='is_active', label='Active Status')
    is_verified = django_filters.BooleanFilter(field_name='is_verified', label='Verified Status')
    show_in_team = django_filters.BooleanFilter(field_name='show_in_team', label='Show In Team')
    
    agency = django_filters.NumberFilter(
        field_name='agency__id',
        label='Agency ID'
    )
    
    city = django_filters.NumberFilter(
        field_name='city__id',
        label='City ID'
    )
    
    rating_min = django_filters.NumberFilter(
        field_name='rating',
        lookup_expr='gte',
        label='Min Rating'
    )
    
    rating_max = django_filters.NumberFilter(
        field_name='rating',
        lookup_expr='lte',
        label='Max Rating'
    )
    
    total_sales_min = django_filters.NumberFilter(
        field_name='total_sales',
        lookup_expr='gte',
        label='Min Total Sales'
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
    
    property_count_min = django_filters.NumberFilter(
        method='filter_property_count_min',
        label='Min Property Count'
    )
    
    class Meta:
        model = PropertyAgent
        fields = []
    
    def filter_search(self, queryset, name, value):
        if not value:
            return queryset
        
        return queryset.filter(
            Q(user__mobile__icontains=value) |
            Q(user__email__icontains=value) |
            Q(user__admin_profile__first_name__icontains=value) |
            Q(user__admin_profile__last_name__icontains=value) |
            Q(license_number__icontains=value) |
            Q(bio__icontains=value)
        )
    
    def filter_property_count_min(self, queryset, name, value):
        if value is None:
            return queryset
        
        return queryset.annotate(
            prop_count=Count('properties')
        ).filter(prop_count__gte=value)
