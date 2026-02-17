from django.core.cache import cache
from django.db.models import Count, Q

from src.real_estate.models.tag import PropertyTag
from src.real_estate.serializers.public.taxonomy_serializer import PropertyTagPublicSerializer
from src.real_estate.utils.cache_public import TagPublicCacheKeys
from src.real_estate.utils.cache_ttl import (
    PUBLIC_TAXONOMY_DETAIL_TTL,
    PUBLIC_TAXONOMY_LIST_TTL,
    PUBLIC_TAXONOMY_POPULAR_TTL,
)


class PropertyTagPublicService:
    ALLOWED_ORDERING_FIELDS = {'title', 'created_at', 'property_count'}

    @staticmethod
    def _normalize_ordering(ordering):
        if not ordering:
            return ('-property_count', 'title')

        candidate = ordering.split(',')[0].strip()
        descending = candidate.startswith('-')
        field = candidate[1:] if descending else candidate

        if field not in PropertyTagPublicService.ALLOWED_ORDERING_FIELDS:
            return ('-property_count', 'title')

        return (f"-{field}" if descending else field,)

    @staticmethod
    def _base_queryset():
        return PropertyTag.objects.filter(
            is_active=True,
            is_public=True,
        ).annotate(
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
    def get_tag_queryset(filters=None, search=None, ordering=None):
        queryset = PropertyTagPublicService._base_queryset()

        if filters:
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
                Q(description__icontains=search) |
                Q(slug__icontains=search)
            )

        queryset = queryset.order_by(*PropertyTagPublicService._normalize_ordering(ordering))
        return queryset

    @staticmethod
    def get_tag_by_slug(slug):
        return PropertyTagPublicService._base_queryset().filter(slug=slug).first()

    @staticmethod
    def get_tag_by_public_id(public_id):
        return PropertyTagPublicService._base_queryset().filter(public_id=public_id).first()

    @staticmethod
    def get_popular_tags(limit=10):
        return PropertyTagPublicService._base_queryset().filter(property_count__gt=0).order_by('-property_count', 'title')[:limit]

    @staticmethod
    def get_tag_list_data(filters=None, search=None, ordering=None):
        cache_key = TagPublicCacheKeys.list(filters=filters, search=search, ordering=ordering)
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return cached_data

        queryset = PropertyTagPublicService.get_tag_queryset(filters=filters, search=search, ordering=ordering)
        data = PropertyTagPublicSerializer(queryset, many=True).data
        cache.set(cache_key, data, PUBLIC_TAXONOMY_LIST_TTL)
        return data

    @staticmethod
    def get_tag_detail_by_slug_data(slug):
        cache_key = TagPublicCacheKeys.detail_slug(slug)
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return cached_data

        tag = PropertyTagPublicService.get_tag_by_slug(slug)
        if not tag:
            return None

        data = PropertyTagPublicSerializer(tag).data
        cache.set(cache_key, data, PUBLIC_TAXONOMY_DETAIL_TTL)
        return data

    @staticmethod
    def get_tag_detail_by_public_id_data(public_id):
        cache_key = TagPublicCacheKeys.detail_public_id(public_id)
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return cached_data

        tag = PropertyTagPublicService.get_tag_by_public_id(public_id)
        if not tag:
            return None

        data = PropertyTagPublicSerializer(tag).data
        cache.set(cache_key, data, PUBLIC_TAXONOMY_DETAIL_TTL)
        return data

    @staticmethod
    def get_popular_tags_data(limit=10):
        cache_key = TagPublicCacheKeys.popular(limit)
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return cached_data

        queryset = PropertyTagPublicService.get_popular_tags(limit=limit)
        data = PropertyTagPublicSerializer(queryset, many=True).data
        cache.set(cache_key, data, PUBLIC_TAXONOMY_POPULAR_TTL)
        return data
