from django.db.models import Count, Q

from src.real_estate.models.feature import PropertyFeature


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
    def get_feature_queryset(filters=None, search=None, ordering=None):
        queryset = PropertyFeaturePublicService._base_queryset()

        if filters:
            group = filters.get('group')
            if group:
                queryset = queryset.filter(group__iexact=group)

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
                Q(group__icontains=search)
            )

        queryset = queryset.order_by(*PropertyFeaturePublicService._normalize_ordering(ordering))
        return queryset

    @staticmethod
    def get_feature_by_public_id(public_id):
        return PropertyFeaturePublicService._base_queryset().filter(public_id=public_id).first()
