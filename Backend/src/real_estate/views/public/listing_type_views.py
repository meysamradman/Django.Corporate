from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny

from src.core.pagination import StandardLimitPagination
from src.core.responses.response import APIResponse
from src.real_estate.messages.messages import LISTING_TYPE_ERRORS, LISTING_TYPE_SUCCESS
from src.real_estate.models.constants import get_listing_type_label
from src.real_estate.models.listing_type import ListingType
from src.real_estate.services.public.listing_type_services import ListingTypePublicService
from src.real_estate.serializers.public.listing_type_serializer import (
    ListingTypePublicListSerializer,
    ListingTypePublicDetailSerializer,
)

class ListingTypePublicViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [AllowAny]
    pagination_class = StandardLimitPagination
    serializer_class = ListingTypePublicListSerializer
    lookup_field = 'slug'

    def get_queryset(self):
        filters = {
            'usage_type': self.request.query_params.get('usage_type'),
            'min_property_count': self.request.query_params.get('min_property_count'),
        }
        filters = {k: v for k, v in filters.items() if v is not None}

        search = self.request.query_params.get('search')
        ordering = self.request.query_params.get('ordering')

        return ListingTypePublicService.get_listing_type_queryset(
            filters=filters,
            search=search,
            ordering=ordering,
        )

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ListingTypePublicDetailSerializer
        return ListingTypePublicListSerializer

    def list(self, request, *args, **kwargs):
        filters = {
            'usage_type': request.query_params.get('usage_type'),
            'min_property_count': request.query_params.get('min_property_count'),
        }
        filters = {k: v for k, v in filters.items() if v is not None}
        search = request.query_params.get('search')
        ordering = request.query_params.get('ordering')

        data = ListingTypePublicService.get_listing_type_list_data(filters=filters, search=search, ordering=ordering)
        page = self.paginate_queryset(data)
        if page is not None:
            return self.get_paginated_response(page)

        return APIResponse.success(
            message=LISTING_TYPE_SUCCESS['listing_type_list_success'],
            data=data,
            status_code=status.HTTP_200_OK,
        )

    def retrieve(self, request, slug=None):
        listing_type_data = ListingTypePublicService.get_listing_type_detail_by_slug_data(slug)

        if not listing_type_data:
            return APIResponse.error(
                message=LISTING_TYPE_ERRORS['listing_type_not_found'],
                status_code=status.HTTP_404_NOT_FOUND,
            )

        return APIResponse.success(
            message=LISTING_TYPE_SUCCESS['listing_type_retrieved'],
            data=listing_type_data,
            status_code=status.HTTP_200_OK,
        )

    @action(detail=False, methods=['get'], url_path='id/(?P<listing_type_id>[^/.]+)')
    def get_by_id(self, request, listing_type_id=None):
        listing_type_data = ListingTypePublicService.get_listing_type_detail_by_id_data(listing_type_id)
        if not listing_type_data:
            return APIResponse.error(
                message=LISTING_TYPE_ERRORS['listing_type_not_found'],
                status_code=status.HTTP_404_NOT_FOUND,
            )

        return APIResponse.success(
            message=LISTING_TYPE_SUCCESS['listing_type_retrieved'],
            data=listing_type_data,
            status_code=status.HTTP_200_OK,
        )

    @action(detail=False, methods=['get'], url_path='p/(?P<public_id>[^/.]+)')
    def get_by_public_id(self, request, public_id=None):
        listing_type_data = ListingTypePublicService.get_listing_type_detail_by_public_id_data(public_id)
        if not listing_type_data:
            return APIResponse.error(
                message=LISTING_TYPE_ERRORS['listing_type_not_found'],
                status_code=status.HTTP_404_NOT_FOUND,
            )

        return APIResponse.success(
            message=LISTING_TYPE_SUCCESS['listing_type_retrieved'],
            data=listing_type_data,
            status_code=status.HTTP_200_OK,
        )

    @action(detail=False, methods=['get'], url_path='featured')
    def featured(self, request):
        limit = self._parse_positive_int(request.query_params.get('limit'), default=3, max_value=24)
        data = ListingTypePublicService.get_featured_listing_types_data(limit=limit)

        return APIResponse.success(
            message=LISTING_TYPE_SUCCESS['listing_type_list_success'],
            data=data,
            status_code=status.HTTP_200_OK,
        )

    @action(detail=False, methods=['get'], url_path='usage-types')
    def usage_types(self, request):
        usage_types = list(
            ListingType.objects.filter(is_active=True)
            .values_list('usage_type', flat=True)
            .distinct()
        )

        data = [
            {
                'value': code,
                'label': get_listing_type_label(code),
            }
            for code in usage_types
            if code
        ]

        return APIResponse.success(
            message=LISTING_TYPE_SUCCESS['listing_type_list_success'],
            data=data,
            status_code=status.HTTP_200_OK,
        )

    @staticmethod
    def _parse_positive_int(value, default, max_value=100):
        try:
            parsed = int(value)
        except (TypeError, ValueError):
            return default

        if parsed < 1:
            return default
        return min(parsed, max_value)
