import django_filters
from django.db.models import Q
from src.user.models.user import User


class AdminManagementAdminFilter(django_filters.FilterSet):
    """
    Filter برای مدیریت Admin Users
    """
    search = django_filters.CharFilter(method='filter_search', label='Search')
    is_active = django_filters.BooleanFilter(field_name='is_active', label='Active Status')
    is_superuser = django_filters.BooleanFilter(field_name='is_superuser', label='Super Admin')
    is_admin_full = django_filters.BooleanFilter(field_name='is_admin_full', label='Full Admin')
    
    user_role_type = django_filters.ChoiceFilter(
        method='filter_user_role_type',
        choices=[
            ('admin', 'Admin'),
            ('super_admin', 'Super Admin'),
            ('full_admin', 'Full Admin'),
        ],
        label='User Role Type'
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
        """جستجو در email, mobile, first_name, last_name"""
        if not value:
            return queryset
        
        return queryset.filter(
            Q(email__icontains=value) |
            Q(mobile__icontains=value) |
            Q(admin_profile__first_name__icontains=value) |
            Q(admin_profile__last_name__icontains=value)
        )
    
    def filter_user_role_type(self, queryset, name, value):
        """فیلتر نوع نقش کاربر"""
        if not value:
            return queryset
        
        if value == 'super_admin':
            return queryset.filter(is_superuser=True)
        elif value == 'full_admin':
            return queryset.filter(is_admin_full=True)
        elif value == 'admin':
            return queryset.filter(is_staff=True)
        
        return queryset
