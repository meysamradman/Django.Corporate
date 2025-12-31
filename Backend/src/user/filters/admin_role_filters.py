import django_filters
from django.db.models import Q, Count
from src.user.models.roles import AdminRole


class AdminRoleAdminFilter(django_filters.FilterSet):
    """
    Filter برای Admin Roles با حفظ منطق دسترسی و نقش‌ها
    """
    search = django_filters.CharFilter(method='filter_search', label='Search')
    is_active = django_filters.BooleanFilter(field_name='is_active', label='Active Status')
    is_system_role = django_filters.BooleanFilter(field_name='is_system_role', label='System Role')
    
    level_min = django_filters.NumberFilter(
        field_name='level',
        lookup_expr='gte',
        label='Minimum Level'
    )
    
    level_max = django_filters.NumberFilter(
        field_name='level',
        lookup_expr='lte',
        label='Maximum Level'
    )
    
    users_count_min = django_filters.NumberFilter(
        method='filter_users_count_min',
        label='Min Users Count'
    )
    
    users_count_max = django_filters.NumberFilter(
        method='filter_users_count_max',
        label='Max Users Count'
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
    
    order_by = django_filters.OrderingFilter(
        fields=(
            ('name', 'name'),
            ('display_name', 'display_name'),
            ('level', 'level'),
            ('created_at', 'created_at'),
            ('updated_at', 'updated_at'),
            ('is_active', 'is_active'),
            ('is_system_role', 'is_system_role'),
        ),
        field_labels={
            'name': 'Role Name',
            'display_name': 'Display Name',
            'level': 'Level',
            'created_at': 'Created At',
            'updated_at': 'Updated At',
            'is_active': 'Active Status',
            'is_system_role': 'System Role',
        }
    )
    
    class Meta:
        model = AdminRole
        fields = []
    
    def filter_search(self, queryset, name, value):
        """جستجو در name و display_name"""
        if not value:
            return queryset
        
        return queryset.filter(
            Q(name__icontains=value) |
            Q(display_name__icontains=value) |
            Q(description__icontains=value)
        )
    
    def filter_users_count_min(self, queryset, name, value):
        """فیلتر تعداد کاربران حداقل"""
        if value is None:
            return queryset
        
        return queryset.annotate(
            users_count=Count('admin_user_roles', filter=Q(admin_user_roles__is_active=True))
        ).filter(users_count__gte=value)
    
    def filter_users_count_max(self, queryset, name, value):
        """فیلتر تعداد کاربران حداکثر"""
        if value is None:
            return queryset
        
        return queryset.annotate(
            users_count=Count('admin_user_roles', filter=Q(admin_user_roles__is_active=True))
        ).filter(users_count__lte=value)
