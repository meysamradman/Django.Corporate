from django.db.models import Count, Q

from src.real_estate.models.tag import PropertyTag


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
