import django_filters
from django.db.models import Q
from src.user.models.user import User

class UserManagementAdminFilter(django_filters.FilterSet):
    
    search = django_filters.CharFilter(method='filter_search', label='Search')
    is_active = django_filters.BooleanFilter(field_name='is_active', label='Active Status')
    
    has_profile = django_filters.BooleanFilter(
        method='filter_has_profile',
        label='Has Complete Profile'
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
    
    last_login_from = django_filters.DateTimeFilter(
        field_name='last_login',
        lookup_expr='gte',
        label='Last Login From'
    )
    
    last_login_to = django_filters.DateTimeFilter(
        field_name='last_login',
        lookup_expr='lte',
        label='Last Login To'
    )
    
    class Meta:
        model = User
        fields = []
    
    def filter_search(self, queryset, name, value):
        
        if not value:
            return queryset
        
        return queryset.filter(
            Q(email__icontains=value) |
            Q(mobile__icontains=value) |
            Q(user_profile__first_name__icontains=value) |
            Q(user_profile__last_name__icontains=value)
        )
    
    def filter_has_profile(self, queryset, name, value):
        
        if value is None:
            return queryset
        
        if value:
            return queryset.filter(user_profile__isnull=False)
        else:
            return queryset.filter(user_profile__isnull=True)
