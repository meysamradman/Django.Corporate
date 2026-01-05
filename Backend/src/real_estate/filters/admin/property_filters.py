import django_filters
from django.db.models import Q, Count
from src.real_estate.models.property import Property
from src.real_estate.models.constants import PROPERTY_STATUS_CHOICES


class PropertyAdminFilter(django_filters.FilterSet):
    status = django_filters.ChoiceFilter(
        choices=PROPERTY_STATUS_CHOICES,
        help_text="Filter by listing lifecycle status"
    )
    
    is_published = django_filters.BooleanFilter(
        help_text="Filter by published status"
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
    
    date_from = django_filters.DateFilter(
        field_name='created_at__date',
        lookup_expr='gte',
        help_text="Filter from this date (YYYY-MM-DD)"
    )
    
    date_to = django_filters.DateFilter(
        field_name='created_at__date',
        lookup_expr='lte',
        help_text="Filter to this date (YYYY-MM-DD)"
    )
    
    published_after = django_filters.DateFilter(
        field_name='published_at',
        lookup_expr='gte',
        help_text="Published after this date (YYYY-MM-DD)"
    )
    
    published_before = django_filters.DateFilter(
        field_name='published_at',
        lookup_expr='lte',
        help_text="Published before this date (YYYY-MM-DD)"
    )
    
    property_type = django_filters.NumberFilter(
        field_name='property_type__id',
        help_text="Filter by property type ID"
    )
    
    state = django_filters.NumberFilter(
        field_name='state__id',
        help_text="Filter by property state ID"
    )
    
    agent = django_filters.NumberFilter(
        field_name='agent__id',
        help_text="Filter by agent ID"
    )
    
    agency = django_filters.NumberFilter(
        field_name='agency__id',
        help_text="Filter by agency ID"
    )
    
    city = django_filters.NumberFilter(
        field_name='city__id',
        help_text="Filter by city ID"
    )
    
    province = django_filters.NumberFilter(
        field_name='province__id',
        help_text="Filter by province ID"
    )
    
    region = django_filters.NumberFilter(
        field_name='region__id',
        help_text="Filter by region ID"
    )

    region_code = django_filters.NumberFilter(
        field_name='region__code',
        help_text="Filter by region code (1-22 for Tehran)"
    )

    neighborhood = django_filters.CharFilter(
        lookup_expr='icontains',
        help_text="Search in neighborhood name"
    )
    
    min_price = django_filters.NumberFilter(
        method='filter_min_price',
        help_text="Minimum price"
    )
    
    max_price = django_filters.NumberFilter(
        method='filter_max_price',
        help_text="Maximum price"
    )
    
    min_area = django_filters.NumberFilter(
        field_name='built_area',
        lookup_expr='gte',
        help_text="Minimum built area"
    )
    
    max_area = django_filters.NumberFilter(
        field_name='built_area',
        lookup_expr='lte',
        help_text="Maximum built area"
    )
    
    bedrooms = django_filters.NumberFilter(
        help_text="Number of bedrooms"
    )
    
    bathrooms = django_filters.NumberFilter(
        help_text="Number of bathrooms"
    )
    
    label = django_filters.NumberFilter(
        field_name='labels__id',
        help_text="Filter by label ID"
    )
    
    tag = django_filters.NumberFilter(
        field_name='tags__id',
        help_text="Filter by tag ID"
    )
    
    feature = django_filters.NumberFilter(
        field_name='features__id',
        help_text="Filter by feature ID"
    )
    
    labels__in = django_filters.CharFilter(
        method='filter_labels_in',
        help_text="Filter by label IDs (comma-separated)"
    )
    
    tags__in = django_filters.CharFilter(
        method='filter_tags_in',
        help_text="Filter by tag IDs (comma-separated)"
    )
    
    features__in = django_filters.CharFilter(
        method='filter_features_in',
        help_text="Filter by feature IDs (comma-separated)"
    )
    
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
    
    search = django_filters.CharFilter(
        method='filter_search',
        help_text="Search in title, description, address, and SEO fields"
    )
    
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
        model = Property
        fields = [
            'is_published', 'is_featured', 'is_public', 'is_active', 'status',
            'created_after', 'created_before', 'published_after', 'published_before',
            'property_type', 'state', 'agent', 'agency',
            'city', 'province', 'region', 'region_code', 'neighborhood',
            'min_price', 'max_price', 'min_area', 'max_area',
            'bedrooms', 'bathrooms',
            'label', 'tag', 'feature',
            'labels__in', 'tags__in', 'features__in',
            'seo_status', 'has_meta_title', 'has_meta_description',
            'has_og_image', 'has_canonical_url',
            'search', 'has_main_image', 'media_count', 'media_count_gte',
        ]
    
    def filter_seo_status(self, queryset, name, value):
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
        if not value:
            return queryset
        
        return queryset.filter(
            Q(title__icontains=value) |
            Q(short_description__icontains=value) |
            Q(description__icontains=value) |
            Q(address__icontains=value) |
            Q(neighborhood__icontains=value) |
            Q(city__name__icontains=value) |
            Q(region__name__icontains=value) |
            Q(meta_title__icontains=value) |
            Q(meta_description__icontains=value) |
            Q(slug__icontains=value) |
            Q(labels__title__icontains=value) |
            Q(tags__title__icontains=value)
        ).distinct()
    
    def filter_has_main_image(self, queryset, name, value):
        if value:
            return queryset.filter(images__is_main=True).distinct()
        else:
            return queryset.exclude(images__is_main=True).distinct()
    
    def filter_media_count(self, queryset, name, value):
        return queryset.annotate(
            total_media_count=Count('images', distinct=True) + 
                             Count('videos', distinct=True) +
                             Count('audios', distinct=True) +
                             Count('documents', distinct=True)
        ).filter(total_media_count=value)
    
    def filter_media_count_gte(self, queryset, name, value):
        return queryset.annotate(
            total_media_count=Count('images', distinct=True) + 
                             Count('videos', distinct=True) +
                             Count('audios', distinct=True) +
                             Count('documents', distinct=True)
        ).filter(total_media_count__gte=value)
    
    def filter_labels_in(self, queryset, name, value):
        if value:
            try:
                label_ids = [int(id.strip()) for id in value.split(',') if id.strip()]
                if label_ids:
                    return queryset.filter(labels__id__in=label_ids).distinct()
            except ValueError:
                pass
        return queryset
    
    def filter_tags_in(self, queryset, name, value):
        if value:
            try:
                tag_ids = [int(id.strip()) for id in value.split(',') if id.strip()]
                if tag_ids:
                    return queryset.filter(tags__id__in=tag_ids).distinct()
            except ValueError:
                pass
        return queryset
    
    def filter_features_in(self, queryset, name, value):
        if value:
            try:
                feature_ids = [int(id.strip()) for id in value.split(',') if id.strip()]
                if feature_ids:
                    return queryset.filter(features__id__in=feature_ids).distinct()
            except ValueError:
                pass
        return queryset
    
    def filter_min_price(self, queryset, name, value):
        if value is not None:
            return queryset.filter(
                Q(price__gte=value) |
                Q(sale_price__gte=value) |
                Q(pre_sale_price__gte=value) |
                Q(monthly_rent__gte=value) |
                Q(rent_amount__gte=value)
            )
        return queryset
    
    def filter_max_price(self, queryset, name, value):
        if value is not None:
            return queryset.filter(
                Q(price__lte=value) |
                Q(sale_price__lte=value) |
                Q(pre_sale_price__lte=value) |
                Q(monthly_rent__lte=value) |
                Q(rent_amount__lte=value)
            )
        return queryset

