import django_filters
from django.db.models import Q, Count
from src.portfolio.models.category import PortfolioCategory


class PortfolioCategoryAdminFilter(django_filters.FilterSet):
    """Advanced filtering for Portfolio Categories in admin panel with tree support"""
    
    # Text search in name and description
    search = django_filters.CharFilter(method='filter_search', label='جستجو')
    
    # Activity status
    is_active = django_filters.BooleanFilter(field_name='is_active', label='وضعیت فعال')
    is_public = django_filters.BooleanFilter(field_name='is_public', label='وضعیت عمومی')
    
    # Tree level filters
    level = django_filters.NumberFilter(field_name='depth', label='سطح درخت')
    level_min = django_filters.NumberFilter(field_name='depth', lookup_expr='gte', label='حداقل سطح')
    level_max = django_filters.NumberFilter(field_name='depth', lookup_expr='lte', label='حداکثر سطح')
    
    # Parent filter
    parent = django_filters.ModelChoiceFilter(
        method='filter_parent',
        queryset=PortfolioCategory.objects.filter(is_active=True),
        label='دسته‌بندی والد'
    )
    
    # Root categories only
    is_root = django_filters.BooleanFilter(method='filter_root', label='فقط دسته‌های اصلی')
    
    # Has children filter
    has_children = django_filters.BooleanFilter(method='filter_has_children', label='دارای زیردسته')
    
    # Usage filter
    usage = django_filters.ChoiceFilter(
        method='filter_usage',
        choices=[
            ('used', 'استفاده شده'),
            ('unused', 'استفاده نشده'),
            ('popular', 'محبوب (بیش از 5 نمونه کار)')
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
    
    # Image status
    has_image = django_filters.BooleanFilter(method='filter_has_image', label='دارای تصویر')
    
    # SEO status
    seo_status = django_filters.ChoiceFilter(
        method='filter_seo_status',
        choices=[
            ('complete', 'SEO کامل'),
            ('incomplete', 'SEO ناقص'),
            ('missing', 'بدون SEO')
        ],
        label='وضعیت SEO'
    )
    
    class Meta:
        model = PortfolioCategory
        fields = []
    
    def filter_search(self, queryset, name, value):
        """Search in name, description, slug"""
        if not value:
            return queryset
        
        return queryset.filter(
            Q(name__icontains=value) |
            Q(description__icontains=value) |
            Q(slug__icontains=value)
        )
    
    def filter_parent(self, queryset, name, value):
        """Filter by parent category (includes descendants)"""
        if not value:
            return queryset
        
        # Get all descendants of the parent
        descendants = value.get_descendants(include_self=True)
        return queryset.filter(id__in=descendants.values_list('id', flat=True))
    
    def filter_root(self, queryset, name, value):
        """Filter root categories only"""
        if value is None:
            return queryset
        
        if value:
            return queryset.filter(depth=1)
        else:
            return queryset.filter(depth__gt=1)
    
    def filter_has_children(self, queryset, name, value):
        """Filter categories with/without children"""
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
        """Filter by usage status"""
        if not value:
            return queryset
        
        if value == 'used':
            return queryset.filter(portfolios__isnull=False).distinct()
        elif value == 'unused':
            return queryset.filter(portfolios__isnull=True)
        elif value == 'popular':
            return queryset.annotate(
                usage_count=Count('portfolios')
            ).filter(usage_count__gte=5)
        
        return queryset
    
    def filter_portfolio_count_min(self, queryset, name, value):
        """Filter by minimum portfolio count"""
        if value is None:
            return queryset
        
        return queryset.annotate(
            usage_count=Count('portfolios')
        ).filter(usage_count__gte=value)
    
    def filter_portfolio_count_max(self, queryset, name, value):
        """Filter by maximum portfolio count"""
        if value is None:
            return queryset
        
        return queryset.annotate(
            usage_count=Count('portfolios')
        ).filter(usage_count__lte=value)
    
    def filter_has_image(self, queryset, name, value):
        """Filter categories with/without image"""
        if value is None:
            return queryset
        
        if value:
            return queryset.filter(image__isnull=False)
        else:
            return queryset.filter(image__isnull=True)
    
    def filter_seo_status(self, queryset, name, value):
        """Filter by SEO completeness"""
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
