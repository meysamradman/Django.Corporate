from datetime import datetime

from django.db.models import Q

from src.real_estate.models.property import Property


class PropertyPublicService:
    ALLOWED_ORDERING_FIELDS = {
        'created_at',
        'updated_at',
        'published_at',
        'price',
        'built_area',
        'views_count',
        'favorites_count',
        'title',
    }

    @staticmethod
    def _parse_int(value):
        try:
            return int(value)
        except (TypeError, ValueError):
            return None

    @staticmethod
    def _parse_date(value):
        if not value:
            return None
        try:
            return datetime.strptime(value, '%Y-%m-%d').date()
        except (TypeError, ValueError):
            return None

    @staticmethod
    def _normalize_ordering(ordering):
        if not ordering:
            return ('-published_at', '-created_at')

        candidate = ordering.split(',')[0].strip()
        descending = candidate.startswith('-')
        field = candidate[1:] if descending else candidate

        if field not in PropertyPublicService.ALLOWED_ORDERING_FIELDS:
            return ('-published_at', '-created_at')

        return (f"-{field}" if descending else field,)

    @staticmethod
    def _base_queryset():
        return Property.objects.for_public_listing().active()

    @staticmethod
    def get_property_queryset(filters=None, search=None, ordering=None):
        queryset = PropertyPublicService._base_queryset()

        if filters:
            status_values = filters.get('status')
            if status_values:
                if isinstance(status_values, str):
                    status_values = [item.strip() for item in status_values.split(',') if item.strip()]
                if status_values:
                    queryset = queryset.filter(status__in=status_values)

            for int_filter in ('property_type', 'state', 'city', 'province', 'region'):
                parsed_value = PropertyPublicService._parse_int(filters.get(int_filter))
                if parsed_value is not None:
                    queryset = queryset.filter(**{f'{int_filter}_id': parsed_value})

            for int_field, orm_field in (
                ('min_price', 'price__gte'),
                ('max_price', 'price__lte'),
                ('min_area', 'built_area__gte'),
                ('max_area', 'built_area__lte'),
                ('bedrooms', 'bedrooms'),
                ('bathrooms', 'bathrooms'),
            ):
                parsed_value = PropertyPublicService._parse_int(filters.get(int_field))
                if parsed_value is not None:
                    queryset = queryset.filter(**{orm_field: parsed_value})

            for bool_field in ('is_featured', 'is_public', 'is_active'):
                parsed_value = filters.get(bool_field)
                if parsed_value is not None:
                    queryset = queryset.filter(**{bool_field: parsed_value})

            for date_field, orm_field in (
                ('created_after', 'created_at__date__gte'),
                ('created_before', 'created_at__date__lte'),
            ):
                parsed_value = PropertyPublicService._parse_date(filters.get(date_field))
                if parsed_value is not None:
                    queryset = queryset.filter(**{orm_field: parsed_value})

            for slug_field, orm_field in (
                ('type_slug', 'property_type__slug'),
                ('state_slug', 'state__slug'),
                ('tag_slug', 'tags__slug'),
                ('label_slug', 'labels__slug'),
                ('feature_public_id', 'features__public_id'),
            ):
                slug_value = filters.get(slug_field)
                if slug_value:
                    queryset = queryset.filter(**{orm_field: slug_value})

        if search:
            queryset = queryset.search(search)

        return queryset.order_by(*PropertyPublicService._normalize_ordering(ordering)).distinct()

    @staticmethod
    def get_property_by_slug(slug):
        return Property.objects.for_detail().published().active().filter(slug=slug).first()

    @staticmethod
    def get_property_by_public_id(public_id):
        return Property.objects.for_detail().published().active().filter(public_id=public_id).first()

    @staticmethod
    def get_featured_properties(limit=10):
        return PropertyPublicService._base_queryset().filter(is_featured=True).order_by('-published_at', '-created_at')[:limit]

    @staticmethod
    def get_related_properties(property_obj, limit=4):
        if not property_obj:
            return Property.objects.none()

        queryset = PropertyPublicService._base_queryset().exclude(id=property_obj.id)

        related_filter = Q()
        if property_obj.property_type_id:
            related_filter |= Q(property_type_id=property_obj.property_type_id)
        if property_obj.state_id:
            related_filter |= Q(state_id=property_obj.state_id)
        if property_obj.city_id:
            related_filter |= Q(city_id=property_obj.city_id)

        if related_filter:
            queryset = queryset.filter(related_filter)

        return queryset.order_by('-is_featured', '-published_at', '-created_at')[:limit]
