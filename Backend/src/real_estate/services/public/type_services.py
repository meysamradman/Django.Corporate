from django.core.cache import cache
from django.db.models import Count, Q

from src.real_estate.models.type import PropertyType
from src.real_estate.serializers.public.taxonomy_serializer import PropertyTypePublicSerializer
from src.real_estate.utils.cache_public import TypePublicCacheKeys
from src.real_estate.utils.cache_ttl import (
    PUBLIC_TAXONOMY_DETAIL_TTL,
    PUBLIC_TAXONOMY_LIST_TTL,
    PUBLIC_TAXONOMY_POPULAR_TTL,
)

class PropertyTypePublicService:
    ALLOWED_ORDERING_FIELDS = {'title', 'created_at', 'display_order', 'property_count'}

    @staticmethod
    def _normalize_ordering(ordering):
        if not ordering:
            return ('path',)

        candidate = ordering.split(',')[0].strip()
        descending = candidate.startswith('-')
        field = candidate[1:] if descending else candidate

        if field not in PropertyTypePublicService.ALLOWED_ORDERING_FIELDS:
            return ('path',)

        return (f"-{field}" if descending else field,)

    @staticmethod
    def _base_queryset():
        return PropertyType.objects.filter(
            is_active=True,
            is_public=True,
        ).select_related('image').annotate(
            property_count=Count(
                'properties',
                filter=Q(
                    properties__is_active=True,
                    properties__is_public=True,
                    properties__is_published=True,
                ),
                distinct=True,
            )
        )

    @staticmethod
    def get_type_queryset(filters=None, search=None, ordering=None):
        queryset = PropertyTypePublicService._base_queryset()

        if filters:
            root_only = filters.get('root_only')
            if root_only is True:
                queryset = queryset.filter(depth=1)

            min_property_count = filters.get('min_property_count')
            try:
                min_property_count = int(min_property_count)
            except (TypeError, ValueError):
                min_property_count = None
            if min_property_count is not None:
                queryset = queryset.filter(property_count__gte=min_property_count)

        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) |
                Q(description__icontains=search)
            )

        return queryset.order_by(*PropertyTypePublicService._normalize_ordering(ordering))

    @staticmethod
    def get_type_by_slug(slug):
        return PropertyTypePublicService._base_queryset().filter(slug=slug).first()

    @staticmethod
    def get_type_by_id(type_id):
        return PropertyTypePublicService._base_queryset().filter(id=type_id).first()

    @staticmethod
    def get_type_by_public_id(public_id):
        return PropertyTypePublicService._base_queryset().filter(public_id=public_id).first()

    @staticmethod
    def get_root_types():
        return PropertyTypePublicService._base_queryset().filter(depth=1).order_by('display_order', 'title')

    @staticmethod
    def get_popular_types(limit=10):
        return PropertyTypePublicService._base_queryset().filter(property_count__gt=0).order_by('-property_count', 'title')[:limit]

    @staticmethod
    def get_tree_queryset():
        return PropertyTypePublicService._base_queryset().order_by('path')

    @staticmethod
    def get_type_list_data(filters=None, search=None, ordering=None):
        cache_key = TypePublicCacheKeys.list(filters=filters, search=search, ordering=ordering)
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return cached_data

        queryset = PropertyTypePublicService.get_type_queryset(filters=filters, search=search, ordering=ordering)
        data = PropertyTypePublicSerializer(queryset, many=True).data
        cache.set(cache_key, data, PUBLIC_TAXONOMY_LIST_TTL)
        return data

    @staticmethod
    def get_type_detail_by_slug_data(slug):
        cache_key = TypePublicCacheKeys.detail_slug(slug)
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return cached_data

        property_type = PropertyTypePublicService.get_type_by_slug(slug)
        if not property_type:
            return None

        data = PropertyTypePublicSerializer(property_type).data
        cache.set(cache_key, data, PUBLIC_TAXONOMY_DETAIL_TTL)
        return data

    @staticmethod
    def get_type_detail_by_id_data(type_id):
        cache_key = TypePublicCacheKeys.detail_id(type_id)
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return cached_data

        property_type = PropertyTypePublicService.get_type_by_id(type_id)
        if not property_type:
            return None

        data = PropertyTypePublicSerializer(property_type).data
        cache.set(cache_key, data, PUBLIC_TAXONOMY_DETAIL_TTL)
        return data

    @staticmethod
    def get_type_detail_by_public_id_data(public_id):
        cache_key = TypePublicCacheKeys.detail_public_id(public_id)
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return cached_data

        property_type = PropertyTypePublicService.get_type_by_public_id(public_id)
        if not property_type:
            return None

        data = PropertyTypePublicSerializer(property_type).data
        cache.set(cache_key, data, PUBLIC_TAXONOMY_DETAIL_TTL)
        return data

    @staticmethod
    def get_root_types_data():
        cache_key = TypePublicCacheKeys.roots()
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return cached_data

        queryset = PropertyTypePublicService.get_root_types()
        data = PropertyTypePublicSerializer(queryset, many=True).data
        cache.set(cache_key, data, PUBLIC_TAXONOMY_LIST_TTL)
        return data

    @staticmethod
    def get_tree_data():
        cache_key = TypePublicCacheKeys.tree()
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return cached_data

        queryset = PropertyTypePublicService.get_tree_queryset()
        data = PropertyTypePublicSerializer(queryset, many=True).data
        cache.set(cache_key, data, PUBLIC_TAXONOMY_LIST_TTL)
        return data

    @staticmethod
    def get_popular_types_data(limit=10):
        cache_key = TypePublicCacheKeys.popular(limit)
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return cached_data

        queryset = PropertyTypePublicService.get_popular_types(limit=limit)
        data = PropertyTypePublicSerializer(queryset, many=True).data
        cache.set(cache_key, data, PUBLIC_TAXONOMY_POPULAR_TTL)
        return data
