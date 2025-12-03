import django_filters
from django.db.models import Q, Count
from src.blog.models.tag import BlogTag


class BlogTagAdminFilter(django_filters.FilterSet):
    search = django_filters.CharFilter(method='filter_search', label='جستجو')
    
    is_active = django_filters.BooleanFilter(field_name='is_active', label='وضعیت فعال')
    usage = django_filters.ChoiceFilter(
        method='filter_usage',
        choices=[
            ('used', 'استفاده شده'),
            ('unused', 'استفاده نشده'),
            ('popular', 'محبوب (بیش از 5 نمونه کار)')
        ],
        label='وضعیت استفاده'
    )
    blog_count_min = django_filters.NumberFilter(
        method='filter_blog_count_min',
        label='حداقل تعداد نمونه کار'
    )
    blog_count_max = django_filters.NumberFilter(
        method='filter_blog_count_max',
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
        model = BlogTag
        fields = []
    
    def filter_search(self, queryset, name, value):
        if not value:
            return queryset
        
        return queryset.filter(
            Q(name__icontains=value) |
            Q(description__icontains=value) |
            Q(slug__icontains=value)
        )
    
    def filter_usage(self, queryset, name, value):
        if not value:
            return queryset
        
        if value == 'used':
            return queryset.filter(blog_tags__isnull=False).distinct()
        elif value == 'unused':
            return queryset.filter(blog_tags__isnull=True)
        elif value == 'popular':
            return queryset.annotate(
                usage_count=Count('blog_tags')
            ).filter(usage_count__gte=5)
        
        return queryset
    
    def filter_blog_count_min(self, queryset, name, value):
        if value is None:
            return queryset
        
        return queryset.annotate(
            usage_count=Count('blog_tags')
        ).filter(usage_count__gte=value)
    
    def filter_blog_count_max(self, queryset, name, value):
        if value is None:
            return queryset
        
        return queryset.annotate(
            usage_count=Count('blog_tags')
        ).filter(usage_count__lte=value)
    
    def filter_name_length(self, queryset, name, value):
        if not value:
            return queryset
        
        if value == 'short':
            return queryset.extra(where=["CHAR_LENGTH(name) < 10"])
        elif value == 'medium':
            return queryset.extra(where=["CHAR_LENGTH(name) BETWEEN 10 AND 20"])
        elif value == 'long':
            return queryset.extra(where=["CHAR_LENGTH(name) > 20"])
        
        return queryset
