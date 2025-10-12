import django_filters
from django.db.models import Q
from src.portfolio.models.portfolio import Portfolio


class PortfolioAdminFilter(django_filters.FilterSet):
    """
    Advanced filtering for Portfolio admin with SEO filters
    """
    
    # Basic filters
    status = django_filters.ChoiceFilter(
        choices=Portfolio.STATUS_CHOICES,
        help_text="Filter by portfolio status"
    )
    
    is_featured = django_filters.BooleanFilter(
        help_text="Filter by featured status"
    )
    
    is_public = django_filters.BooleanFilter(
        help_text="Filter by public visibility"
    )
    
    is_active = django_filters.BooleanFilter(
        help_text="Filter by active status"
    )
    
    # Date filters
    created_after = django_filters.DateFilter(
        field_name='created_at',
        lookup_expr='gte',
        help_text="Created after this date (YYYY-MM-DD)"
    )
    
    created_before = django_filters.DateFilter(
        field_name='created_at',
        lookup_expr='lte',
        help_text="Created before this date (YYYY-MM-DD)"
    )
    
    # Category and tag filters
    category = django_filters.NumberFilter(
        field_name='categories__id',
        help_text="Filter by category ID"
    )
    
    category_slug = django_filters.CharFilter(
        field_name='categories__slug',
        help_text="Filter by category slug"
    )
    
    tag = django_filters.NumberFilter(
        field_name='tags__id',
        help_text="Filter by tag ID"
    )
    
    tag_slug = django_filters.CharFilter(
        field_name='tags__slug',
        help_text="Filter by tag slug"
    )
    
    # SEO filters
    seo_status = django_filters.ChoiceFilter(
        method='filter_seo_status',
        choices=[
            ('complete', 'Complete SEO'),
            ('incomplete', 'Incomplete SEO'),
            ('missing', 'Missing SEO'),
        ],
        help_text="Filter by SEO completeness status"
    )
    
    has_meta_title = django_filters.BooleanFilter(
        field_name='meta_title',
        lookup_expr='isnull',
        exclude=True,
        help_text="Has meta title"
    )
    
    has_meta_description = django_filters.BooleanFilter(
        field_name='meta_description',
        lookup_expr='isnull',
        exclude=True,
        help_text="Has meta description"
    )
    
    has_og_image = django_filters.BooleanFilter(
        field_name='og_image',
        lookup_expr='isnull',
        exclude=True,
        help_text="Has OG image"
    )
    
    has_canonical_url = django_filters.BooleanFilter(
        field_name='canonical_url',
        lookup_expr='isnull',
        exclude=True,
        help_text="Has canonical URL"
    )
    
    # Text search across multiple fields
    search = django_filters.CharFilter(
        method='filter_search',
        help_text="Search in title, description, and SEO fields"
    )
    
    # Media filters
    has_main_image = django_filters.BooleanFilter(
        method='filter_has_main_image',
        help_text="Has main image assigned"
    )
    
    media_count = django_filters.NumberFilter(
        method='filter_media_count',
        help_text="Filter by exact number of media files"
    )
    
    media_count_gte = django_filters.NumberFilter(
        method='filter_media_count_gte',
        help_text="Filter by minimum number of media files"
    )
    
    class Meta:
        model = Portfolio
        fields = [
            'status', 'is_featured', 'is_public', 'is_active',
            'created_after', 'created_before',
            'category', 'category_slug', 'tag', 'tag_slug',
            'seo_status', 'has_meta_title', 'has_meta_description',
            'has_og_image', 'has_canonical_url',
            'search', 'has_main_image', 'media_count', 'media_count_gte'
        ]
    
    def filter_seo_status(self, queryset, name, value):
        """Filter by SEO completeness status"""
        if value == 'complete':
            return queryset.filter(
                meta_title__isnull=False,
                meta_description__isnull=False,
                og_image__isnull=False
            )
        elif value == 'incomplete':
            return queryset.filter(
                Q(meta_title__isnull=False) | 
                Q(meta_description__isnull=False) | 
                Q(og_image__isnull=False)
            ).exclude(
                meta_title__isnull=False,
                meta_description__isnull=False,
                og_image__isnull=False
            )
        elif value == 'missing':
            return queryset.filter(
                meta_title__isnull=True,
                meta_description__isnull=True,
                og_image__isnull=True
            )
        return queryset
    
    def filter_search(self, queryset, name, value):
        """Advanced search across multiple fields"""
        if not value:
            return queryset
        
        return queryset.filter(
            Q(title__icontains=value) |
            Q(short_description__icontains=value) |
            Q(description__icontains=value) |
            Q(meta_title__icontains=value) |
            Q(meta_description__icontains=value) |
            Q(slug__icontains=value) |
            Q(categories__name__icontains=value) |
            Q(tags__name__icontains=value)
        ).distinct()
    
    def filter_has_main_image(self, queryset, name, value):
        """Filter portfolios with/without main image"""
        if value:
            return queryset.filter(portfolio_medias__is_main_image=True).distinct()
        else:
            return queryset.exclude(portfolio_medias__is_main_image=True).distinct()
    
    def filter_media_count(self, queryset, name, value):
        """Filter by exact media count"""
        from django.db.models import Count
        return queryset.annotate(
            media_count=Count('portfolio_medias')
        ).filter(media_count=value)
    
    def filter_media_count_gte(self, queryset, name, value):
        """Filter by minimum media count"""
        from django.db.models import Count
        return queryset.annotate(
            media_count=Count('portfolio_medias')
        ).filter(media_count__gte=value)


class PortfolioSEOFilter(django_filters.FilterSet):
    """
    Specialized filter for SEO analysis
    """
    
    # SEO quality filters
    title_length_good = django_filters.BooleanFilter(
        method='filter_title_length_good',
        help_text="Title length is optimal (≤60 chars)"
    )
    
    description_length_good = django_filters.BooleanFilter(
        method='filter_description_length_good',
        help_text="Description length is optimal (120-160 chars)"
    )
    
    missing_alt_text = django_filters.BooleanFilter(
        method='filter_missing_alt_text',
        help_text="Has images without alt text"
    )
    
    duplicate_meta_title = django_filters.BooleanFilter(
        method='filter_duplicate_meta_title',
        help_text="Has duplicate meta title"
    )
    
    class Meta:
        model = Portfolio
        fields = ['title_length_good', 'description_length_good', 'missing_alt_text', 'duplicate_meta_title']
    
    def filter_title_length_good(self, queryset, name, value):
        """Filter by optimal title length"""
        if value:
            return queryset.extra(
                where=["CHAR_LENGTH(meta_title) <= 60 AND meta_title IS NOT NULL"]
            )
        else:
            return queryset.extra(
                where=["CHAR_LENGTH(meta_title) > 60 OR meta_title IS NULL"]
            )
    
    def filter_description_length_good(self, queryset, name, value):
        """Filter by optimal description length"""
        if value:
            return queryset.extra(
                where=["CHAR_LENGTH(meta_description) BETWEEN 120 AND 160 AND meta_description IS NOT NULL"]
            )
        else:
            return queryset.extra(
                where=["CHAR_LENGTH(meta_description) NOT BETWEEN 120 AND 160 OR meta_description IS NULL"]
            )
    
    def filter_missing_alt_text(self, queryset, name, value):
        """Filter portfolios with images missing alt text"""
        # This would need to be implemented based on your media model structure
        # For now, return the queryset as-is
        return queryset
    
    def filter_duplicate_meta_title(self, queryset, name, value):
        """Filter portfolios with duplicate meta titles"""
        if value:
            from django.db.models import Count
            duplicate_titles = Portfolio.objects.values('meta_title').annotate(
                title_count=Count('meta_title')
            ).filter(title_count__gt=1, meta_title__isnull=False).values_list('meta_title', flat=True)
            
            return queryset.filter(meta_title__in=duplicate_titles)
        else:
            # Non-duplicate titles
            from django.db.models import Count
            duplicate_titles = Portfolio.objects.values('meta_title').annotate(
                title_count=Count('meta_title')
            ).filter(title_count__gt=1, meta_title__isnull=False).values_list('meta_title', flat=True)
            
            return queryset.exclude(meta_title__in=duplicate_titles)
