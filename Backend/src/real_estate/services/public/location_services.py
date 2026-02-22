from django.core.cache import cache
from django.db.models import Count, Q

from src.core.models import City, Province
from src.real_estate.models.location import CityRegion
from src.real_estate.serializers.public.location_serializer import CityPublicSerializer, ProvincePublicSerializer, RegionPublicSerializer
from src.real_estate.utils.cache_public import LocationPublicCacheKeys
from src.real_estate.utils.cache_ttl import PUBLIC_TAXONOMY_DETAIL_TTL, PUBLIC_TAXONOMY_LIST_TTL


class PropertyLocationPublicService:
    PROVINCE_ALLOWED_ORDERING_FIELDS = {"name", "created_at", "property_count"}
    CITY_ALLOWED_ORDERING_FIELDS = {"name", "created_at", "province__name"}
    REGION_ALLOWED_ORDERING_FIELDS = {"name", "created_at", "city__name", "city__province__name"}

    @staticmethod
    def _normalize_ordering(ordering: str | None, allowed_fields: set[str], default_field: str) -> tuple[str, ...]:
        if not ordering:
            return (default_field,)

        candidate = ordering.split(",")[0].strip()
        descending = candidate.startswith("-")
        field = candidate[1:] if descending else candidate

        if field not in allowed_fields:
            return (default_field,)

        return (f"-{field}" if descending else field,)

    @staticmethod
    def _parse_int(value):
        try:
            return int(value)
        except (TypeError, ValueError):
            return None

    @staticmethod
    def _base_provinces_queryset():
        return Province.objects.filter(is_active=True).annotate(
            property_count=Count(
                "real_estate_properties",
                filter=Q(
                    real_estate_properties__is_active=True,
                    real_estate_properties__is_public=True,
                    real_estate_properties__is_published=True,
                ),
            )
        )

    @staticmethod
    def get_provinces_queryset(filters=None, search: str | None = None, ordering: str | None = None):
        queryset = PropertyLocationPublicService._base_provinces_queryset()

        if filters:
            min_property_count = PropertyLocationPublicService._parse_int(filters.get("min_property_count"))
            if min_property_count is not None:
                queryset = queryset.filter(property_count__gte=min_property_count)

        if search:
            queryset = queryset.filter(
                Q(name__icontains=search)
                | Q(code__icontains=search)
                | Q(slug__icontains=search)
            )

        queryset = queryset.order_by(
            *PropertyLocationPublicService._normalize_ordering(
                ordering=ordering,
                allowed_fields=PropertyLocationPublicService.PROVINCE_ALLOWED_ORDERING_FIELDS,
                default_field="name",
            )
        )
        return queryset

    @staticmethod
    def get_cities_queryset(filters=None, search: str | None = None, ordering: str | None = None):
        queryset = City.objects.filter(is_active=True).select_related("province")

        if filters:
            province_id = filters.get("province_id")
            if province_id:
                queryset = queryset.filter(province_id=province_id)

        if search:
            queryset = queryset.filter(
                Q(name__icontains=search)
                | Q(code__icontains=search)
                | Q(slug__icontains=search)
                | Q(province__name__icontains=search)
                | Q(province__slug__icontains=search)
            )

        queryset = queryset.order_by(
            *PropertyLocationPublicService._normalize_ordering(
                ordering=ordering,
                allowed_fields=PropertyLocationPublicService.CITY_ALLOWED_ORDERING_FIELDS,
                default_field="province__name",
            ),
            "name",
        )
        return queryset

    @staticmethod
    def get_province_list_data(filters=None, search: str | None = None, ordering: str | None = None):
        normalized_filters = filters or {}
        cache_key = LocationPublicCacheKeys.province_list(filters=normalized_filters, search=search, ordering=ordering)
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return cached_data

        queryset = PropertyLocationPublicService.get_provinces_queryset(
            filters=normalized_filters,
            search=search,
            ordering=ordering,
        )
        data = ProvincePublicSerializer(queryset, many=True).data
        cache.set(cache_key, data, PUBLIC_TAXONOMY_LIST_TTL)
        return data

    @staticmethod
    def get_city_list_data(filters=None, search: str | None = None, ordering: str | None = None):
        normalized_filters = filters or {}
        cache_key = LocationPublicCacheKeys.city_list(filters=normalized_filters, search=search, ordering=ordering)
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return cached_data

        queryset = PropertyLocationPublicService.get_cities_queryset(
            filters=normalized_filters,
            search=search,
            ordering=ordering,
        )
        data = CityPublicSerializer(queryset, many=True).data
        cache.set(cache_key, data, PUBLIC_TAXONOMY_LIST_TTL)
        return data

    @staticmethod
    def get_province_detail_by_id_data(province_id):
        cache_key = LocationPublicCacheKeys.province_detail(province_id)
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return cached_data

        province = PropertyLocationPublicService._base_provinces_queryset().filter(id=province_id).first()
        if not province:
            return None

        data = ProvincePublicSerializer(province).data
        cache.set(cache_key, data, PUBLIC_TAXONOMY_DETAIL_TTL)
        return data

    @staticmethod
    def get_city_detail_by_id_data(city_id):
        cache_key = LocationPublicCacheKeys.city_detail(city_id)
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return cached_data

        city = City.objects.filter(id=city_id, is_active=True).select_related("province").first()
        if not city:
            return None

        data = CityPublicSerializer(city).data
        cache.set(cache_key, data, PUBLIC_TAXONOMY_DETAIL_TTL)
        return data

    @staticmethod
    def get_regions_queryset(filters=None, search: str | None = None, ordering: str | None = None):
        queryset = CityRegion.objects.filter(is_active=True).select_related("city", "city__province")

        if filters:
            city_id = filters.get("city_id")
            if city_id:
                queryset = queryset.filter(city_id=city_id)

            province_id = filters.get("province_id")
            if province_id:
                queryset = queryset.filter(city__province_id=province_id)

        if search:
            queryset = queryset.filter(
                Q(name__icontains=search)
                | Q(code__icontains=search)
                | Q(city__name__icontains=search)
                | Q(city__province__name__icontains=search)
            )

        queryset = queryset.order_by(
            *PropertyLocationPublicService._normalize_ordering(
                ordering=ordering,
                allowed_fields=PropertyLocationPublicService.REGION_ALLOWED_ORDERING_FIELDS,
                default_field="city__province__name",
            ),
            "city__name",
            "name",
        )
        return queryset

    @staticmethod
    def get_region_list_data(filters=None, search: str | None = None, ordering: str | None = None):
        normalized_filters = filters or {}
        cache_key = LocationPublicCacheKeys.region_list(filters=normalized_filters, search=search, ordering=ordering)
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return cached_data

        queryset = PropertyLocationPublicService.get_regions_queryset(
            filters=normalized_filters,
            search=search,
            ordering=ordering,
        )
        data = RegionPublicSerializer(queryset, many=True).data
        cache.set(cache_key, data, PUBLIC_TAXONOMY_LIST_TTL)
        return data

    @staticmethod
    def get_region_detail_by_id_data(region_id):
        cache_key = LocationPublicCacheKeys.region_detail(region_id)
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return cached_data

        region = CityRegion.objects.filter(id=region_id, is_active=True).select_related("city", "city__province").first()
        if not region:
            return None

        data = RegionPublicSerializer(region).data
        cache.set(cache_key, data, PUBLIC_TAXONOMY_DETAIL_TTL)
        return data
