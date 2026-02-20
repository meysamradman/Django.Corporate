from django.core.cache import cache
from django.db.models import Count, Q

from src.real_estate.models.state import PropertyState
from src.real_estate.serializers.public.state_serializer import PropertyStatePublicSerializer
from src.real_estate.utils.cache_public import StatePublicCacheKeys
from src.real_estate.utils.cache_ttl import (
    PUBLIC_TAXONOMY_DETAIL_TTL,
    PUBLIC_TAXONOMY_LIST_TTL,
)

class PropertyStatePublicService:
    ALLOWED_ORDERING_FIELDS = {'title', 'created_at', 'property_count'}

    @staticmethod
    def _parse_int(value):
        try:
            return int(value)
        except (TypeError, ValueError):
            return None

    @staticmethod
    def _normalize_ordering(ordering):
        if not ordering:
            return ('title',)

        candidate = ordering.split(',')[0].strip()
        descending = candidate.startswith('-')
        field = candidate[1:] if descending else candidate

        if field not in PropertyStatePublicService.ALLOWED_ORDERING_FIELDS:
            return ('title',)

        return (f"-{field}" if descending else field,)

    @staticmethod
    def _base_queryset():
        return PropertyState.objects.filter(
            is_active=True,
        ).select_related('image').annotate(
            property_count=Count(
                'properties',
                filter=Q(
                    properties__is_active=True,
                    properties__is_public=True,
                    properties__is_published=True,
                ),
            )
        )

    @staticmethod
    def get_state_queryset(filters=None, search=None, ordering=None):
        queryset = PropertyStatePublicService._base_queryset()

        if filters:
            usage_type = filters.get('usage_type')
            if usage_type:
                queryset = queryset.filter(usage_type=usage_type)

            min_property_count = PropertyStatePublicService._parse_int(filters.get('min_property_count'))
            if min_property_count is not None:
                queryset = queryset.filter(property_count__gte=min_property_count)

        if search:
            queryset = queryset.filter(
                Q(title__icontains=search)
                | Q(slug__icontains=search)
            )

        queryset = queryset.order_by(*PropertyStatePublicService._normalize_ordering(ordering))
        return queryset

    @staticmethod
    def get_state_by_slug(slug):
        return PropertyStatePublicService._base_queryset().filter(slug=slug).first()

    @staticmethod
    def get_state_by_id(state_id):
        return PropertyStatePublicService._base_queryset().filter(id=state_id).first()

    @staticmethod
    def get_state_by_public_id(public_id):
        return PropertyStatePublicService._base_queryset().filter(public_id=public_id).first()

    @staticmethod
    def get_featured_states(limit=3):
        return PropertyStatePublicService._base_queryset().filter(
            property_count__gt=0,
        ).order_by('-property_count', 'title')[:limit]

    @staticmethod
    def get_state_list_data(filters=None, search=None, ordering=None):
        cache_key = StatePublicCacheKeys.list(filters=filters, search=search, ordering=ordering)
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return cached_data

        queryset = PropertyStatePublicService.get_state_queryset(filters=filters, search=search, ordering=ordering)
        data = PropertyStatePublicSerializer(queryset, many=True).data
        cache.set(cache_key, data, PUBLIC_TAXONOMY_LIST_TTL)
        return data

    @staticmethod
    def get_state_detail_by_slug_data(slug):
        cache_key = StatePublicCacheKeys.detail_slug(slug)
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return cached_data

        state = PropertyStatePublicService.get_state_by_slug(slug)
        if not state:
            return None

        data = PropertyStatePublicSerializer(state).data
        cache.set(cache_key, data, PUBLIC_TAXONOMY_DETAIL_TTL)
        return data

    @staticmethod
    def get_state_detail_by_id_data(state_id):
        cache_key = StatePublicCacheKeys.detail_id(state_id)
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return cached_data

        state = PropertyStatePublicService.get_state_by_id(state_id)
        if not state:
            return None

        data = PropertyStatePublicSerializer(state).data
        cache.set(cache_key, data, PUBLIC_TAXONOMY_DETAIL_TTL)
        return data

    @staticmethod
    def get_state_detail_by_public_id_data(public_id):
        cache_key = StatePublicCacheKeys.detail_public_id(public_id)
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return cached_data

        state = PropertyStatePublicService.get_state_by_public_id(public_id)
        if not state:
            return None

        data = PropertyStatePublicSerializer(state).data
        cache.set(cache_key, data, PUBLIC_TAXONOMY_DETAIL_TTL)
        return data

    @staticmethod
    def get_featured_states_data(limit=3):
        cache_key = StatePublicCacheKeys.featured(limit)
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return cached_data

        queryset = PropertyStatePublicService.get_featured_states(limit=limit)
        data = PropertyStatePublicSerializer(queryset, many=True).data
        cache.set(cache_key, data, PUBLIC_TAXONOMY_LIST_TTL)
        return data
