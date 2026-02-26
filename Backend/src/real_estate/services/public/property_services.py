from datetime import datetime

from django.core.cache import cache
from django.db.models import Q

from src.real_estate.models.property import Property
from src.real_estate.serializers.public.property_serializer import (
    PropertyPublicDetailSerializer,
    PropertyPublicListSerializer,
)
from src.real_estate.utils.cache_public import PropertyPublicCacheKeys
from src.real_estate.utils.cache_ttl import (
    PUBLIC_PROPERTY_DETAIL_TTL,
    PUBLIC_PROPERTY_FEATURED_TTL,
    PUBLIC_PROPERTY_LIST_TTL,
    PUBLIC_PROPERTY_RELATED_TTL,
)

class PropertyPublicService:
    ALLOWED_ORDERING_FIELDS = {
        'created_at',
        'updated_at',
        'published_at',
        'price',
        'built_area',
        'views_count',
        'favorites_count',
        'title',
    }

    @staticmethod
    def _parse_int(value):
        try:
            return int(value)
        except (TypeError, ValueError):
            return None

    @staticmethod
    def _parse_date(value):
        if not value:
            return None
        try:
            return datetime.strptime(value, '%Y-%m-%d').date()
        except (TypeError, ValueError):
            return None

    @staticmethod
    def _apply_building_age_bucket_filter(queryset, bucket):
        if not bucket:
            return queryset

        normalized_bucket = str(bucket).strip().lower()
        current_year = Property.get_current_shamsi_year()

        if normalized_bucket == 'new':
            return queryset.filter(year_built__gte=current_year - 1, year_built__lte=current_year)
        if normalized_bucket == '1_5':
            return queryset.filter(year_built__gte=current_year - 5, year_built__lte=current_year - 1)
        if normalized_bucket == '6_10':
            return queryset.filter(year_built__gte=current_year - 10, year_built__lte=current_year - 6)
        if normalized_bucket == '11_20':
            return queryset.filter(year_built__gte=current_year - 20, year_built__lte=current_year - 11)
        if normalized_bucket == '21_30':
            return queryset.filter(year_built__gte=current_year - 30, year_built__lte=current_year - 21)
        if normalized_bucket == '30_plus':
            return queryset.filter(year_built__lte=current_year - 31)

        return queryset

    @staticmethod
    def _apply_building_age_range_filter(queryset, min_age, max_age):
        parsed_min = PropertyPublicService._parse_int(min_age)
        parsed_max = PropertyPublicService._parse_int(max_age)

        if parsed_min is None and parsed_max is None:
            return queryset, False

        if parsed_min is not None and parsed_min < 0:
            parsed_min = 0
        if parsed_max is not None and parsed_max < 0:
            parsed_max = 0

        if parsed_min is not None and parsed_max is not None and parsed_min > parsed_max:
            parsed_min, parsed_max = parsed_max, parsed_min

        current_year = Property.get_current_shamsi_year()
        filtered = queryset

        # Age N means built_year = current_year - N
        if parsed_min is not None:
            filtered = filtered.filter(year_built__lte=current_year - parsed_min)
        if parsed_max is not None:
            filtered = filtered.filter(year_built__gte=current_year - parsed_max)

        return filtered, True

    @staticmethod
    def _normalize_ordering(ordering):
        if not ordering:
            return ('-published_at', '-created_at')

        candidate = ordering.split(',')[0].strip()
        descending = candidate.startswith('-')
        field = candidate[1:] if descending else candidate

        if field not in PropertyPublicService.ALLOWED_ORDERING_FIELDS:
            return ('-published_at', '-created_at')

        return (f"-{field}" if descending else field,)

    @staticmethod
    def _base_queryset():
        return Property.objects.for_public_listing().active()

    @staticmethod
    def get_property_queryset(filters=None, search=None, ordering=None):
        queryset = PropertyPublicService._base_queryset()

        if filters:
            status_values = filters.get('status')
            if status_values:
                if isinstance(status_values, str):
                    status_values = [item.strip() for item in status_values.split(',') if item.strip()]
                if status_values:
                    queryset = queryset.filter(status__in=status_values)

            for int_filter in ('property_type', 'state', 'city', 'province', 'region'):
                parsed_value = PropertyPublicService._parse_int(filters.get(int_filter))
                if parsed_value is not None:
                    queryset = queryset.filter(**{f'{int_filter}_id': parsed_value})

            queryset, has_manual_age_range = PropertyPublicService._apply_building_age_range_filter(
                queryset,
                filters.get('building_age_min'),
                filters.get('building_age_max'),
            )

            if not has_manual_age_range:
                queryset = PropertyPublicService._apply_building_age_bucket_filter(
                    queryset,
                    filters.get('building_age_bucket'),
                )

            for int_field, orm_field in (
                ('min_price', 'price__gte'),
                ('max_price', 'price__lte'),
                ('min_area', 'built_area__gte'),
                ('max_area', 'built_area__lte'),
                ('bedrooms', 'bedrooms'),
                ('bathrooms', 'bathrooms'),
                ('kitchens', 'kitchens'),
                ('living_rooms', 'living_rooms'),
                ('year_built', 'year_built'),
                ('parking_spaces', 'parking_spaces'),
                ('storage_rooms', 'storage_rooms'),
            ):
                parsed_value = PropertyPublicService._parse_int(filters.get(int_field))
                if parsed_value is not None:
                    queryset = queryset.filter(**{orm_field: parsed_value})

            for bool_field in ('is_featured', 'is_public', 'is_active'):
                parsed_value = filters.get(bool_field)
                if parsed_value is not None:
                    queryset = queryset.filter(**{bool_field: parsed_value})

            has_parking = filters.get('has_parking')
            if has_parking is True:
                queryset = queryset.filter(parking_spaces__gt=0)
            elif has_parking is False:
                queryset = queryset.filter(Q(parking_spaces=0) | Q(parking_spaces__isnull=True))

            has_storage = filters.get('has_storage')
            if has_storage is True:
                queryset = queryset.filter(storage_rooms__gt=0)
            elif has_storage is False:
                queryset = queryset.filter(Q(storage_rooms=0) | Q(storage_rooms__isnull=True))

            has_elevator = filters.get('has_elevator')
            if has_elevator is not None:
                queryset = queryset.filter(has_elevator=has_elevator)

            for date_field, orm_field in (
                ('created_after', 'created_at__date__gte'),
                ('created_before', 'created_at__date__lte'),
            ):
                parsed_value = PropertyPublicService._parse_date(filters.get(date_field))
                if parsed_value is not None:
                    queryset = queryset.filter(**{orm_field: parsed_value})

            for slug_field, orm_field in (
                ('type_slug', 'property_type__slug'),
                ('state_slug', 'state__slug'),
                ('tag_slug', 'tags__slug'),
                ('label_slug', 'labels__slug'),
                ('label_public_id', 'labels__public_id'),
                ('feature_public_id', 'features__public_id'),
            ):
                slug_value = filters.get(slug_field)
                if slug_value:
                    queryset = queryset.filter(**{orm_field: slug_value})

        search = (search or '').strip()
        if len(search) >= 2:
            queryset = queryset.search(search)

        return queryset.order_by(*PropertyPublicService._normalize_ordering(ordering)).distinct()

    @staticmethod
    def get_property_by_slug(slug):
        return Property.objects.for_detail().published().active().filter(slug=slug).first()

    @staticmethod
    def get_property_by_id(property_id):
        return Property.objects.for_detail().published().active().filter(id=property_id).first()

    @staticmethod
    def get_property_by_public_id(public_id):
        return Property.objects.for_detail().published().active().filter(public_id=public_id).first()

    @staticmethod
    def get_featured_properties(limit=10):
        return PropertyPublicService._base_queryset().filter(is_featured=True).order_by('-published_at', '-created_at')[:limit]

    @staticmethod
    def get_related_properties(property_obj, limit=4):
        if not property_obj:
            return Property.objects.none()

        queryset = PropertyPublicService._base_queryset().exclude(id=property_obj.id)

        related_filter = Q()
        if property_obj.property_type_id:
            related_filter |= Q(property_type_id=property_obj.property_type_id)
        if property_obj.state_id:
            related_filter |= Q(state_id=property_obj.state_id)
        if property_obj.city_id:
            related_filter |= Q(city_id=property_obj.city_id)

        if related_filter:
            queryset = queryset.filter(related_filter)

        return queryset.order_by('-is_featured', '-published_at', '-created_at')[:limit]

    @staticmethod
    def get_property_list_data(filters=None, search=None, ordering=None):
        cache_key = PropertyPublicCacheKeys.list(filters=filters, search=search, ordering=ordering)
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return cached_data

        queryset = PropertyPublicService.get_property_queryset(filters=filters, search=search, ordering=ordering)
        data = PropertyPublicListSerializer(queryset, many=True).data
        cache.set(cache_key, data, PUBLIC_PROPERTY_LIST_TTL)
        return data

    @staticmethod
    def get_property_detail_by_slug_data(slug):
        cache_key = PropertyPublicCacheKeys.detail_slug(slug)
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return cached_data

        property_obj = PropertyPublicService.get_property_by_slug(slug)
        if not property_obj:
            return None

        data = PropertyPublicDetailSerializer(property_obj).data
        cache.set(cache_key, data, PUBLIC_PROPERTY_DETAIL_TTL)
        return data

    @staticmethod
    def get_property_detail_by_id_data(property_id):
        cache_key = PropertyPublicCacheKeys.detail_id(property_id)
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return cached_data

        property_obj = PropertyPublicService.get_property_by_id(property_id)
        if not property_obj:
            return None

        data = PropertyPublicDetailSerializer(property_obj).data
        cache.set(cache_key, data, PUBLIC_PROPERTY_DETAIL_TTL)
        return data

    @staticmethod
    def get_property_detail_by_public_id_data(public_id):
        cache_key = PropertyPublicCacheKeys.detail_public_id(public_id)
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return cached_data

        property_obj = PropertyPublicService.get_property_by_public_id(public_id)
        if not property_obj:
            return None

        data = PropertyPublicDetailSerializer(property_obj).data
        cache.set(cache_key, data, PUBLIC_PROPERTY_DETAIL_TTL)
        return data

    @staticmethod
    def get_featured_properties_data(limit=10):
        cache_key = PropertyPublicCacheKeys.featured(limit)
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return cached_data

        queryset = PropertyPublicService.get_featured_properties(limit=limit)
        data = PropertyPublicListSerializer(queryset, many=True).data
        cache.set(cache_key, data, PUBLIC_PROPERTY_FEATURED_TTL)
        return data

    @staticmethod
    def get_related_properties_data(property_obj, limit=4):
        if not property_obj:
            return []

        cache_key = PropertyPublicCacheKeys.related(property_obj.slug, limit)
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return cached_data

        queryset = PropertyPublicService.get_related_properties(property_obj, limit=limit)
        data = PropertyPublicListSerializer(queryset, many=True).data
        cache.set(cache_key, data, PUBLIC_PROPERTY_RELATED_TTL)
        return data
