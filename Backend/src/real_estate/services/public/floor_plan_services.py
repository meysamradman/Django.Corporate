from django.core.cache import cache
from django.db.models import Q

from src.real_estate.models.floor_plan import RealEstateFloorPlan
from src.real_estate.serializers.public.floor_plan_serializer import FloorPlanPublicListSerializer
from src.real_estate.utils.cache_public import FloorPlanPublicCacheKeys
from src.real_estate.utils.cache_ttl import (
    PUBLIC_FLOOR_PLAN_DETAIL_TTL,
    PUBLIC_FLOOR_PLAN_LIST_TTL,
)


class FloorPlanPublicService:
    ALLOWED_ORDERING_FIELDS = {
        'created_at',
        'updated_at',
        'display_order',
        'floor_number',
        'price',
        'floor_size',
    }

    @staticmethod
    def _parse_int(value):
        try:
            return int(value)
        except (TypeError, ValueError):
            return None

    @staticmethod
    def _parse_bool(value):
        if value is None:
            return None
        if isinstance(value, bool):
            return value
        return str(value).lower() in ('1', 'true', 'yes', 'on')

    @staticmethod
    def _normalize_ordering(ordering):
        if not ordering:
            return ('display_order', 'floor_number', 'id')

        candidate = ordering.split(',')[0].strip()
        descending = candidate.startswith('-')
        field = candidate[1:] if descending else candidate

        if field not in FloorPlanPublicService.ALLOWED_ORDERING_FIELDS:
            return ('display_order', 'floor_number', 'id')

        return (f"-{field}" if descending else field,)

    @staticmethod
    def _base_queryset():
        return RealEstateFloorPlan.objects.filter(
            is_active=True,
            property_obj__is_active=True,
            property_obj__is_public=True,
            property_obj__is_published=True,
        ).select_related(
            'property_obj',
        ).prefetch_related(
            'images__image',
        )

    @staticmethod
    def get_floor_plan_queryset(filters=None, search=None, ordering=None):
        queryset = FloorPlanPublicService._base_queryset()

        if filters:
            property_id = FloorPlanPublicService._parse_int(filters.get('property_id'))
            if property_id is not None:
                queryset = queryset.filter(property_obj_id=property_id)

            is_available = FloorPlanPublicService._parse_bool(filters.get('is_available'))
            if is_available is not None:
                queryset = queryset.filter(is_available=is_available)

            min_floor_size = FloorPlanPublicService._parse_int(filters.get('min_floor_size'))
            if min_floor_size is not None:
                queryset = queryset.filter(floor_size__gte=min_floor_size)

            max_floor_size = FloorPlanPublicService._parse_int(filters.get('max_floor_size'))
            if max_floor_size is not None:
                queryset = queryset.filter(floor_size__lte=max_floor_size)

            min_price = FloorPlanPublicService._parse_int(filters.get('min_price'))
            if min_price is not None:
                queryset = queryset.filter(price__gte=min_price)

            max_price = FloorPlanPublicService._parse_int(filters.get('max_price'))
            if max_price is not None:
                queryset = queryset.filter(price__lte=max_price)

        if search:
            queryset = queryset.filter(
                Q(title__icontains=search)
                | Q(description__icontains=search)
                | Q(unit_type__icontains=search)
            )

        return queryset.order_by(*FloorPlanPublicService._normalize_ordering(ordering))

    @staticmethod
    def get_floor_plan_by_slug(slug):
        return FloorPlanPublicService._base_queryset().filter(slug=slug).first()

    @staticmethod
    def get_floor_plan_by_public_id(public_id):
        return FloorPlanPublicService._base_queryset().filter(public_id=public_id).first()

    @staticmethod
    def get_floor_plan_by_id(floor_plan_id):
        return FloorPlanPublicService._base_queryset().filter(id=floor_plan_id).first()

    @staticmethod
    def get_floor_plan_list_data(filters=None, search=None, ordering=None):
        cache_key = FloorPlanPublicCacheKeys.list(filters=filters, search=search, ordering=ordering)
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return cached_data

        queryset = FloorPlanPublicService.get_floor_plan_queryset(filters=filters, search=search, ordering=ordering)
        data = FloorPlanPublicListSerializer(queryset, many=True).data
        cache.set(cache_key, data, PUBLIC_FLOOR_PLAN_LIST_TTL)
        return data

    @staticmethod
    def get_floor_plan_detail_by_slug_data(slug):
        cache_key = FloorPlanPublicCacheKeys.detail_slug(slug)
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return cached_data

        floor_plan = FloorPlanPublicService.get_floor_plan_by_slug(slug)
        if not floor_plan:
            return None

        data = FloorPlanPublicListSerializer(floor_plan).data
        cache.set(cache_key, data, PUBLIC_FLOOR_PLAN_DETAIL_TTL)
        return data

    @staticmethod
    def get_floor_plan_detail_by_public_id_data(public_id):
        cache_key = FloorPlanPublicCacheKeys.detail_public_id(public_id)
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return cached_data

        floor_plan = FloorPlanPublicService.get_floor_plan_by_public_id(public_id)
        if not floor_plan:
            return None

        data = FloorPlanPublicListSerializer(floor_plan).data
        cache.set(cache_key, data, PUBLIC_FLOOR_PLAN_DETAIL_TTL)
        return data

    @staticmethod
    def get_floor_plan_detail_by_id_data(floor_plan_id):
        cache_key = FloorPlanPublicCacheKeys.detail_id(floor_plan_id)
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return cached_data

        floor_plan = FloorPlanPublicService.get_floor_plan_by_id(floor_plan_id)
        if not floor_plan:
            return None

        data = FloorPlanPublicListSerializer(floor_plan).data
        cache.set(cache_key, data, PUBLIC_FLOOR_PLAN_DETAIL_TTL)
        return data
