import hashlib
import json
from django.db.models import Count, Q

from src.real_estate.models.type import PropertyType


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
