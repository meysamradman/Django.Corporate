from django.core.cache import cache
from django.db.models import Count, Q

from src.real_estate.models.listing_type import ListingType
from src.real_estate.serializers.public.listing_type_serializer import ListingTypePublicSerializer
from src.real_estate.utils.cache_public import ListingTypePublicCacheKeys
from src.real_estate.utils.cache_ttl import (
    PUBLIC_TAXONOMY_DETAIL_TTL,
    PUBLIC_TAXONOMY_LIST_TTL,
)

class ListingTypePublicService:
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

        if field not in ListingTypePublicService.ALLOWED_ORDERING_FIELDS:
            return ('title',)

        return (f"-{field}" if descending else field,)

    @staticmethod
    def _base_queryset():
        return ListingType.objects.filter(
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
    def get_listing_type_queryset(filters=None, search=None, ordering=None):
        queryset = ListingTypePublicService._base_queryset()

        if filters:
            usage_type = filters.get('usage_type')
            if usage_type:
                queryset = queryset.filter(usage_type=usage_type)

            min_property_count = ListingTypePublicService._parse_int(filters.get('min_property_count'))
            if min_property_count is not None:
                queryset = queryset.filter(property_count__gte=min_property_count)

        if search:
            queryset = queryset.filter(
                Q(title__icontains=search)
                | Q(slug__icontains=search)
            )

        queryset = queryset.order_by(*ListingTypePublicService._normalize_ordering(ordering))
        return queryset

    @staticmethod
    def get_listing_type_by_slug(slug):
        return ListingTypePublicService._base_queryset().filter(slug=slug).first()

    @staticmethod
    def get_listing_type_by_id(listing_type_id):
        return ListingTypePublicService._base_queryset().filter(id=listing_type_id).first()

    @staticmethod
    def get_listing_type_by_public_id(public_id):
        return ListingTypePublicService._base_queryset().filter(public_id=public_id).first()

    @staticmethod
    def get_featured_listing_types(limit=3):
        return ListingTypePublicService._base_queryset().filter(
            property_count__gt=0,
        ).order_by('-property_count', 'title')[:limit]

    @staticmethod
    def get_listing_type_list_data(filters=None, search=None, ordering=None):
        cache_key = ListingTypePublicCacheKeys.list(filters=filters, search=search, ordering=ordering)
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return cached_data

        queryset = ListingTypePublicService.get_listing_type_queryset(filters=filters, search=search, ordering=ordering)
        data = ListingTypePublicSerializer(queryset, many=True).data
        cache.set(cache_key, data, PUBLIC_TAXONOMY_LIST_TTL)
        return data

    @staticmethod
    def get_listing_type_detail_by_slug_data(slug):
        cache_key = ListingTypePublicCacheKeys.detail_slug(slug)
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return cached_data

        listing_type = ListingTypePublicService.get_listing_type_by_slug(slug)
        if not listing_type:
            return None

        data = ListingTypePublicSerializer(listing_type).data
        cache.set(cache_key, data, PUBLIC_TAXONOMY_DETAIL_TTL)
        return data

    @staticmethod
    def get_listing_type_detail_by_id_data(listing_type_id):
        cache_key = ListingTypePublicCacheKeys.detail_id(listing_type_id)
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return cached_data

        listing_type = ListingTypePublicService.get_listing_type_by_id(listing_type_id)
        if not listing_type:
            return None

        data = ListingTypePublicSerializer(listing_type).data
        cache.set(cache_key, data, PUBLIC_TAXONOMY_DETAIL_TTL)
        return data

    @staticmethod
    def get_listing_type_detail_by_public_id_data(public_id):
        cache_key = ListingTypePublicCacheKeys.detail_public_id(public_id)
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return cached_data

        listing_type = ListingTypePublicService.get_listing_type_by_public_id(public_id)
        if not listing_type:
            return None

        data = ListingTypePublicSerializer(listing_type).data
        cache.set(cache_key, data, PUBLIC_TAXONOMY_DETAIL_TTL)
        return data

    @staticmethod
    def get_featured_listing_types_data(limit=3):
        cache_key = ListingTypePublicCacheKeys.featured(limit)
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return cached_data

        queryset = ListingTypePublicService.get_featured_listing_types(limit=limit)
        data = ListingTypePublicSerializer(queryset, many=True).data
        cache.set(cache_key, data, PUBLIC_TAXONOMY_LIST_TTL)
        return data

