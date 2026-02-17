from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny

from src.core.pagination import StandardLimitPagination
from src.core.responses.response import APIResponse
from src.real_estate.messages.messages import PROPERTY_ERRORS, PROPERTY_SUCCESS
from src.real_estate.models.constants.property_status_choices import get_property_status_choices_list
from src.real_estate.serializers.public.property_serializer import (
    PropertyPublicDetailSerializer,
    PropertyPublicListSerializer,
)
from src.real_estate.services.public.property_services import PropertyPublicService

class PropertyPublicViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [AllowAny]
    lookup_field = 'slug'
    pagination_class = StandardLimitPagination

    def get_queryset(self):
        return PropertyPublicService.get_property_queryset()

    def get_serializer_class(self):
        if self.action == 'list':
            return PropertyPublicListSerializer
        return PropertyPublicDetailSerializer

    def list(self, request, *args, **kwargs):
        filters = {
            'status': request.query_params.get('status'),
            'is_featured': self._parse_bool(request.query_params.get('is_featured')),
            'is_public': self._parse_bool(request.query_params.get('is_public')),
            'is_active': self._parse_bool(request.query_params.get('is_active')),
            'property_type': request.query_params.get('property_type'),
            'state': request.query_params.get('state'),
            'city': request.query_params.get('city'),
            'province': request.query_params.get('province'),
            'region': request.query_params.get('region'),
            'min_price': request.query_params.get('min_price'),
            'max_price': request.query_params.get('max_price'),
            'min_area': request.query_params.get('min_area'),
            'max_area': request.query_params.get('max_area'),
            'bedrooms': request.query_params.get('bedrooms'),
            'bathrooms': request.query_params.get('bathrooms'),
            'created_after': request.query_params.get('created_after'),
            'created_before': request.query_params.get('created_before'),
            'type_slug': request.query_params.get('type_slug'),
            'state_slug': request.query_params.get('state_slug'),
            'tag_slug': request.query_params.get('tag_slug'),
            'label_slug': request.query_params.get('label_slug'),
            'label_public_id': request.query_params.get('label_public_id'),
            'feature_public_id': request.query_params.get('feature_public_id'),
        }
        filters = {k: v for k, v in filters.items() if v is not None}

        search = request.query_params.get('search')
        ordering = self._resolve_ordering(
            request.query_params.get('ordering'),
            request.query_params.get('order_by'),
            self._parse_bool(request.query_params.get('order_desc')),
        )

        data = PropertyPublicService.get_property_list_data(filters=filters, search=search, ordering=ordering)
        page = self.paginate_queryset(data)
        if page is not None:
            return self.get_paginated_response(page)

        return APIResponse.success(
            message=PROPERTY_SUCCESS['property_list_success'],
            data=data,
            status_code=status.HTTP_200_OK,
        )

    def retrieve(self, request, *args, **kwargs):
        slug = kwargs.get('slug')
        property_data = PropertyPublicService.get_property_detail_by_slug_data(slug)
        if not property_data:
            return APIResponse.error(
                message=PROPERTY_ERRORS['property_not_found'],
                status_code=status.HTTP_404_NOT_FOUND,
            )

        return APIResponse.success(
            message=PROPERTY_SUCCESS['property_retrieved'],
            data=property_data,
            status_code=status.HTTP_200_OK,
        )

    @action(detail=False, methods=['get'], url_path='p/(?P<public_id>[^/.]+)')
    def get_by_public_id(self, request, public_id=None):
        property_data = PropertyPublicService.get_property_detail_by_public_id_data(public_id)
        if not property_data:
            return APIResponse.error(
                message=PROPERTY_ERRORS['property_not_found'],
                status_code=status.HTTP_404_NOT_FOUND,
            )

        return APIResponse.success(
            message=PROPERTY_SUCCESS['property_retrieved'],
            data=property_data,
            status_code=status.HTTP_200_OK,
        )

    @action(detail=False, methods=['get'])
    def featured(self, request):
        limit = self._parse_positive_int(request.query_params.get('limit'), default=6, max_value=24)
        data = PropertyPublicService.get_featured_properties_data(limit=limit)
        return APIResponse.success(
            message=PROPERTY_SUCCESS['property_list_success'],
            data=data,
            status_code=status.HTTP_200_OK,
        )

    @action(detail=True, methods=['get'])
    def related(self, request, slug=None):
        property_obj = PropertyPublicService.get_property_by_slug(slug)
        if not property_obj:
            return APIResponse.error(
                message=PROPERTY_ERRORS['property_not_found'],
                status_code=status.HTTP_404_NOT_FOUND,
            )

        limit = self._parse_positive_int(request.query_params.get('limit'), default=4, max_value=24)
        data = PropertyPublicService.get_related_properties_data(property_obj, limit=limit)
        return APIResponse.success(
            message=PROPERTY_SUCCESS['property_list_success'],
            data=data,
            status_code=status.HTTP_200_OK,
        )

    @action(detail=False, methods=['get'])
    def statuses(self, request):
        status_choices = [
            {
                'value': code,
                'label': label,
            }
            for code, label in get_property_status_choices_list()
        ]
        return APIResponse.success(
            message=PROPERTY_SUCCESS['property_list_success'],
            data=status_choices,
            status_code=status.HTTP_200_OK,
        )

    @staticmethod
    def _parse_bool(value):
        if value is None:
            return None
        if isinstance(value, bool):
            return value
        return value.lower() in ('1', 'true', 'yes', 'on')

    @staticmethod
    def _parse_positive_int(value, default, max_value=100):
        try:
            parsed = int(value)
        except (TypeError, ValueError):
            return default

        if parsed < 1:
            return default
        return min(parsed, max_value)

    @staticmethod
    def _resolve_ordering(ordering, order_by, order_desc):
        if ordering:
            return ordering
        if not order_by:
            return None
        if order_desc is None:
            return order_by
        return f"-{order_by}" if order_desc else order_by
