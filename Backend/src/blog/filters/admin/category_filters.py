import django_filters
from django.db.models import Q, Count
from src.blog.models.category import BlogCategory


class BlogCategoryAdminFilter(django_filters.FilterSet):
    search = django_filters.CharFilter(method='filter_search', label='Search')
    is_active = django_filters.BooleanFilter(field_name='is_active', label='Active Status')
    is_public = django_filters.BooleanFilter(field_name='is_public', label='Public Status')
    level = django_filters.NumberFilter(field_name='depth', label='Tree Level')
    level_min = django_filters.NumberFilter(field_name='depth', lookup_expr='gte', label='Min Level')
    level_max = django_filters.NumberFilter(field_name='depth', lookup_expr='lte', label='Max Level')
    parent = django_filters.ModelChoiceFilter(
        method='filter_parent',
        queryset=BlogCategory.objects.filter(is_active=True),
        label='Parent Category'
    )
    is_root = django_filters.BooleanFilter(method='filter_root', label='Root Categories Only')
    has_children = django_filters.BooleanFilter(method='filter_has_children', label='Has Children')
    usage = django_filters.ChoiceFilter(
        method='filter_usage',
        choices=[
            ('used', 'Used'),
            ('unused', 'Unused'),
            ('popular', 'Popular (More than 5 blogs)')
        ],
        label='Usage Status'
    )
    blog_count_min = django_filters.NumberFilter(
        method='filter_blog_count_min',
        label='Min Blog Count'
    )
    blog_count_max = django_filters.NumberFilter(
        method='filter_blog_count_max',
        label='Max Blog Count'
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
    has_image = django_filters.BooleanFilter(method='filter_has_image', label='Has Image')
    seo_status = django_filters.ChoiceFilter(
        method='filter_seo_status',
        choices=[
            ('complete', 'Complete SEO'),
            ('incomplete', 'Incomplete SEO'),
            ('missing', 'No SEO')
        ],
        label='SEO Status'
    )
    
    class Meta:
        model = BlogCategory
        fields = []
    
    def filter_search(self, queryset, name, value):
        if not value:
            return queryset
        
        return queryset.filter(
            Q(name__icontains=value) |
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
            return queryset.filter(blogs__isnull=False).distinct()
        elif value == 'unused':
            return queryset.filter(blogs__isnull=True)
        elif value == 'popular':
            return queryset.annotate(
                usage_count=Count('blogs')
            ).filter(usage_count__gte=5)
        
        return queryset
    
    def filter_blog_count_min(self, queryset, name, value):
        if value is None:
            return queryset
        
        return queryset.annotate(
            usage_count=Count('blogs')
        ).filter(usage_count__gte=value)
    
    def filter_blog_count_max(self, queryset, name, value):
        if value is None:
            return queryset
        
        return queryset.annotate(
            usage_count=Count('blogs')
        ).filter(usage_count__lte=value)
    
    def filter_has_image(self, queryset, name, value):
        if value is None:
            return queryset
        
        if value:
            return queryset.filter(image__isnull=False)
        else:
            return queryset.filter(image__isnull=True)
    
    def filter_seo_status(self, queryset, name, value):
        if not value:
            return queryset
        
        if value == 'complete':
            return queryset.filter(
                meta_title__isnull=False,
                meta_description__isnull=False,
                canonical_url__isnull=False
            ).exclude(
                Q(meta_title='') | Q(meta_description='') | Q(canonical_url='')
            )
        elif value == 'incomplete':
            return queryset.filter(
                Q(meta_title__isnull=False, meta_title__gt='') |
                Q(meta_description__isnull=False, meta_description__gt='') |
                Q(canonical_url__isnull=False, canonical_url__gt='')
            ).exclude(
                meta_title__isnull=False,
                meta_description__isnull=False,
                canonical_url__isnull=False,
                meta_title__gt='',
                meta_description__gt='',
                canonical_url__gt=''
            )
        elif value == 'missing':
            return queryset.filter(
                Q(meta_title__isnull=True) | Q(meta_title=''),
                Q(meta_description__isnull=True) | Q(meta_description=''),
                Q(canonical_url__isnull=True) | Q(canonical_url='')
            )
        
        return queryset
