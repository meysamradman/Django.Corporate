import django_filters
from django.db.models import Q, Count
from src.real_estate.models.property import Property
from src.real_estate.models.constants import PROPERTY_STATUS_CHOICES

class PropertyAdminFilter(django_filters.FilterSet):
    _SALE_USAGE_TYPES = ('sale', 'presale', 'exchange', 'mortgage')
    _RENT_USAGE_TYPES = ('rent',)

    status = django_filters.CharFilter(
        method='filter_status',
        help_text="Filter by listing lifecycle status (single or comma-separated)"
    )
    
    ids = django_filters.CharFilter(
        method='filter_ids',
        help_text="Filter by multiple IDs (comma-separated)"
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
    
    property_type = django_filters.CharFilter(
        method='filter_property_type',
        help_text="Filter by property type ID (single or comma-separated)"
    )
    
    state = django_filters.CharFilter(
        method='filter_state',
        help_text="Filter by property state ID (single or comma-separated)"
    )
    
    agent = django_filters.CharFilter(
        method='filter_agent',
        help_text="Filter by agent ID (single or comma-separated)"
    )
    
    agency = django_filters.CharFilter(
        method='filter_agency',
        help_text="Filter by agency ID (single or comma-separated)"
    )
    
    created_by = django_filters.CharFilter(
        method='filter_created_by',
        help_text="Filter by creator (admin user) ID (single or comma-separated)"
    )
    
    city = django_filters.CharFilter(
        method='filter_city',
        help_text="Filter by city ID (single or comma-separated)"
    )
    
    province = django_filters.CharFilter(
        method='filter_province',
        help_text="Filter by province ID (single or comma-separated)"
    )
    
    region = django_filters.CharFilter(
        method='filter_region',
        help_text="Filter by region ID (single or comma-separated)"
    )

    region_code = django_filters.CharFilter(
        method='filter_region_code',
        help_text="Filter by region code (single or comma-separated)"
    )

    property_types__in = django_filters.CharFilter(
        method='filter_property_type',
        help_text="Alias for property_type"
    )
    states__in = django_filters.CharFilter(
        method='filter_state',
        help_text="Alias for state"
    )
    cities__in = django_filters.CharFilter(
        method='filter_city',
        help_text="Alias for city"
    )
    statuses__in = django_filters.CharFilter(
        method='filter_status',
        help_text="Alias for status"
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

    min_sale_price = django_filters.NumberFilter(
        method='filter_min_sale_price',
        help_text="Minimum sale-related price (price/sale_price/pre_sale_price)"
    )

    max_sale_price = django_filters.NumberFilter(
        method='filter_max_sale_price',
        help_text="Maximum sale-related price (price/sale_price/pre_sale_price)"
    )

    min_rent_price = django_filters.NumberFilter(
        method='filter_min_rent_price',
        help_text="Minimum rent-related price (monthly_rent/rent_amount)"
    )

    max_rent_price = django_filters.NumberFilter(
        method='filter_max_rent_price',
        help_text="Maximum rent-related price (monthly_rent/rent_amount)"
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
        help_text="Essential search (title/location/slug)"
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
            'property_type', 'state', 'agent', 'agency', 'created_by',
            'city', 'province', 'region', 'region_code', 'neighborhood',
            'min_price', 'max_price',
            'min_sale_price', 'max_sale_price', 'min_rent_price', 'max_rent_price',
            'min_area', 'max_area',
            'bedrooms', 'bathrooms',
            'label', 'tag', 'feature',
            'labels__in', 'tags__in', 'features__in',
            'seo_status', 'has_meta_title', 'has_meta_description',
            'has_og_image', 'has_canonical_url',
            'search', 'has_main_image', 'media_count', 'media_count_gte', 'ids',
            'property_types__in', 'states__in', 'cities__in', 'statuses__in',
        ]
    
    def filter_ids(self, queryset, name, value):
        if value:
            try:
                ids = [int(id.strip()) for id in value.split(',') if id.strip().isdigit()]
                if ids:
                    return queryset.filter(id__in=ids)
            except ValueError:
                pass
        return queryset

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
        value = (value or '').strip()
        if not value or len(value) < 2:
            return queryset

        base_queryset = queryset.search(value)
        return base_queryset
    
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
            return queryset.filter(self._build_price_q('gte', value))
        return queryset
    
    def filter_max_price(self, queryset, name, value):
        if value is not None:
            return queryset.filter(self._build_price_q('lte', value))
        return queryset

    def filter_min_sale_price(self, queryset, name, value):
        if value is not None:
            sale_q = self._build_sale_price_q('gte', value)
            return queryset.filter(
                (Q(state__usage_type__in=self._SALE_USAGE_TYPES) & sale_q) |
                (Q(state__isnull=True) & sale_q)
            )
        return queryset

    def filter_max_sale_price(self, queryset, name, value):
        if value is not None:
            sale_q = self._build_sale_price_q('lte', value)
            return queryset.filter(
                (Q(state__usage_type__in=self._SALE_USAGE_TYPES) & sale_q) |
                (Q(state__isnull=True) & sale_q)
            )
        return queryset

    def filter_min_rent_price(self, queryset, name, value):
        if value is not None:
            rent_q = self._build_rent_price_q('gte', value)
            return queryset.filter(
                (Q(state__usage_type__in=self._RENT_USAGE_TYPES) & rent_q) |
                (Q(state__isnull=True) & rent_q)
            )
        return queryset

    def filter_max_rent_price(self, queryset, name, value):
        if value is not None:
            rent_q = self._build_rent_price_q('lte', value)
            return queryset.filter(
                (Q(state__usage_type__in=self._RENT_USAGE_TYPES) & rent_q) |
                (Q(state__isnull=True) & rent_q)
            )
        return queryset

    def _build_sale_price_q(self, lookup, value):
        return (
            Q(**{f'price__{lookup}': value}) |
            Q(**{f'sale_price__{lookup}': value}) |
            Q(**{f'pre_sale_price__{lookup}': value})
        )

    def _build_rent_price_q(self, lookup, value):
        return (
            Q(**{f'monthly_rent__{lookup}': value}) |
            Q(**{f'rent_amount__{lookup}': value})
        )

    def _build_price_q(self, lookup, value):
        sale_q = self._build_sale_price_q(lookup, value)
        rent_q = self._build_rent_price_q(lookup, value)
        legacy_q = sale_q | rent_q

        return (
            (Q(state__usage_type__in=self._SALE_USAGE_TYPES) & sale_q) |
            (Q(state__usage_type__in=self._RENT_USAGE_TYPES) & rent_q) |
            (Q(state__usage_type='other') & legacy_q) |
            (Q(state__isnull=True) & legacy_q)
        )

    def filter_property_type(self, queryset, name, value):
        if value:
            try:
                ids = [int(id.strip()) for id in value.split(',') if id.strip().isdigit()]
                if ids:
                    return queryset.filter(property_type__id__in=ids)
            except ValueError:
                pass
        return queryset

    def filter_state(self, queryset, name, value):
        if value:
            try:
                ids = [int(id.strip()) for id in value.split(',') if id.strip().isdigit()]
                if ids:
                    return queryset.filter(state__id__in=ids)
            except ValueError:
                pass
        return queryset

    def filter_status(self, queryset, name, value):
        if value:
            statuses = [s.strip() for s in value.split(',') if s.strip()]
            if statuses:
                return queryset.filter(status__in=statuses)
        return queryset

    def filter_agent(self, queryset, name, value):
        if value:
            try:
                ids = [int(id.strip()) for id in value.split(',') if id.strip().isdigit()]
                if ids:
                    return queryset.filter(agent__id__in=ids)
            except ValueError:
                pass
        return queryset

    def filter_agency(self, queryset, name, value):
        if value:
            try:
                ids = [int(id.strip()) for id in value.split(',') if id.strip().isdigit()]
                if ids:
                    return queryset.filter(agency__id__in=ids)
            except ValueError:
                pass
        return queryset

    def filter_created_by(self, queryset, name, value):
        if value:
            try:
                ids = [int(id.strip()) for id in value.split(',') if id.strip().isdigit()]
                if ids:
                    return queryset.filter(created_by__id__in=ids)
            except ValueError:
                pass
        return queryset

    def filter_city(self, queryset, name, value):
        if value:
            try:
                ids = [int(id.strip()) for id in value.split(',') if id.strip().isdigit()]
                if ids:
                    return queryset.filter(city__id__in=ids)
            except ValueError:
                pass
        return queryset

    def filter_province(self, queryset, name, value):
        if value:
            try:
                ids = [int(id.strip()) for id in value.split(',') if id.strip().isdigit()]
                if ids:
                    return queryset.filter(province__id__in=ids)
            except ValueError:
                pass
        return queryset

    def filter_region(self, queryset, name, value):
        if value:
            try:
                ids = [int(id.strip()) for id in value.split(',') if id.strip().isdigit()]
                if ids:
                    return queryset.filter(region__id__in=ids)
            except ValueError:
                pass
        return queryset

    def filter_region_code(self, queryset, name, value):
        if value:
            try:
                codes = [int(code.strip()) for code in value.split(',') if code.strip().isdigit()]
                if codes:
                    return queryset.filter(region__code__in=codes)
            except ValueError:
                pass
        return queryset
