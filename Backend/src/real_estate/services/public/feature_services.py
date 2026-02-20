from django.core.cache import cache
from django.db.models import Count, Q

from src.real_estate.models.feature import PropertyFeature
from src.real_estate.serializers.public.taxonomy_serializer import PropertyFeaturePublicSerializer
from src.real_estate.utils.cache_public import FeaturePublicCacheKeys
from src.real_estate.utils.cache_ttl import (
    PUBLIC_TAXONOMY_DETAIL_TTL,
    PUBLIC_TAXONOMY_LIST_TTL,
)

class PropertyFeaturePublicService:
    ALLOWED_ORDERING_FIELDS = {'title', 'group', 'created_at', 'property_count'}

    @staticmethod
    def _normalize_ordering(ordering):
        if not ordering:
            return ('group', 'title')

        candidate = ordering.split(',')[0].strip()
        descending = candidate.startswith('-')
        field = candidate[1:] if descending else candidate

        if field not in PropertyFeaturePublicService.ALLOWED_ORDERING_FIELDS:
            return ('group', 'title')

        return (f"-{field}" if descending else field,)

    @staticmethod
    def _base_queryset():
        return PropertyFeature.objects.filter(
            is_active=True,
        ).select_related('image', 'parent').annotate(
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
    def get_feature_queryset(filters=None, search=None, ordering=None):
        queryset = PropertyFeaturePublicService._base_queryset()

        if filters:
            group = filters.get('group')
            if group:
                queryset = queryset.filter(group__iexact=group)

            parent_id = filters.get('parent_id')
            try:
                parent_id = int(parent_id)
            except (TypeError, ValueError):
                parent_id = None
            if parent_id is not None:
                queryset = queryset.filter(parent_id=parent_id)

            parent_public_id = filters.get('parent_public_id')
            if parent_public_id:
                queryset = queryset.filter(parent__public_id=parent_public_id)

            roots_only = filters.get('roots_only')
            if str(roots_only).lower() in {'1', 'true', 'yes', 'on'}:
                queryset = queryset.filter(parent__isnull=True)

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
                Q(group__icontains=search) |
                Q(parent__title__icontains=search)
            )

        queryset = queryset.order_by(*PropertyFeaturePublicService._normalize_ordering(ordering))
        return queryset

    @staticmethod
    def get_feature_by_public_id(public_id):
        return PropertyFeaturePublicService._base_queryset().filter(public_id=public_id).first()

    @staticmethod
    def get_feature_by_id(feature_id):
        return PropertyFeaturePublicService._base_queryset().filter(id=feature_id).first()

    @staticmethod
    def get_feature_list_data(filters=None, search=None, ordering=None):
        cache_key = FeaturePublicCacheKeys.list(filters=filters, search=search, ordering=ordering)
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return cached_data

        queryset = PropertyFeaturePublicService.get_feature_queryset(filters=filters, search=search, ordering=ordering)
        data = PropertyFeaturePublicSerializer(queryset, many=True).data
        cache.set(cache_key, data, PUBLIC_TAXONOMY_LIST_TTL)
        return data

    @staticmethod
    def get_feature_detail_by_public_id_data(public_id):
        cache_key = FeaturePublicCacheKeys.detail_public_id(public_id)
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return cached_data

        feature = PropertyFeaturePublicService.get_feature_by_public_id(public_id)
        if not feature:
            return None

        data = PropertyFeaturePublicSerializer(feature).data
        cache.set(cache_key, data, PUBLIC_TAXONOMY_DETAIL_TTL)
        return data

    @staticmethod
    def get_feature_detail_by_id_data(feature_id):
        cache_key = FeaturePublicCacheKeys.detail_id(feature_id)
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return cached_data

        feature = PropertyFeaturePublicService.get_feature_by_id(feature_id)
        if not feature:
            return None

        data = PropertyFeaturePublicSerializer(feature).data
        cache.set(cache_key, data, PUBLIC_TAXONOMY_DETAIL_TTL)
        return data
