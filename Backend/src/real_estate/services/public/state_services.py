from django.db.models import Count, Q

from src.real_estate.models.state import PropertyState


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
        payload = {
            'filters': filters or {},
            'search': search or '',
            'ordering': PropertyStatePublicService._normalize_ordering(ordering),
        }

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
                Q(title__icontains=search) | Q(slug__icontains=search)
            )

        queryset = queryset.order_by(*PropertyStatePublicService._normalize_ordering(ordering))
        return queryset

    @staticmethod
    def get_state_by_slug(slug):
        return PropertyStatePublicService._base_queryset().filter(slug=slug).first()

    @staticmethod
    def get_state_by_public_id(public_id):
        return PropertyStatePublicService._base_queryset().filter(public_id=public_id).first()

    @staticmethod
    def get_featured_states(limit=3):
        return PropertyStatePublicService._base_queryset().filter(
            property_count__gt=0,
        ).order_by('-property_count', 'title')[:limit]
