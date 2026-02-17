from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny

from src.core.pagination import StandardLimitPagination
from src.core.responses.response import APIResponse
from src.real_estate.messages.messages import STATE_ERRORS, STATE_SUCCESS
from src.real_estate.services.public.state_services import PropertyStatePublicService
from src.real_estate.serializers.public.state_serializer import (
    PropertyStatePublicListSerializer,
    PropertyStatePublicDetailSerializer,
)

class PropertyStatePublicViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [AllowAny]
    pagination_class = StandardLimitPagination
    serializer_class = PropertyStatePublicListSerializer
    lookup_field = 'slug'

    def get_queryset(self):
        filters = {
            'usage_type': self.request.query_params.get('usage_type'),
            'min_property_count': self.request.query_params.get('min_property_count'),
        }
        filters = {k: v for k, v in filters.items() if v is not None}

        search = self.request.query_params.get('search')
        ordering = self.request.query_params.get('ordering')

        return PropertyStatePublicService.get_state_queryset(
            filters=filters,
            search=search,
            ordering=ordering,
        )

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return PropertyStatePublicDetailSerializer
        return PropertyStatePublicListSerializer

    def list(self, request, *args, **kwargs):
        filters = {
            'usage_type': request.query_params.get('usage_type'),
            'min_property_count': request.query_params.get('min_property_count'),
        }
        filters = {k: v for k, v in filters.items() if v is not None}
        search = request.query_params.get('search')
        ordering = request.query_params.get('ordering')

        data = PropertyStatePublicService.get_state_list_data(filters=filters, search=search, ordering=ordering)
        page = self.paginate_queryset(data)
        if page is not None:
            return self.get_paginated_response(page)

        return APIResponse.success(
            message=STATE_SUCCESS['state_list_success'],
            data=data,
            status_code=status.HTTP_200_OK,
        )

    def retrieve(self, request, slug=None):
        state_data = PropertyStatePublicService.get_state_detail_by_slug_data(slug)

        if not state_data:
            return APIResponse.error(
                message=STATE_ERRORS['state_not_found'],
                status_code=status.HTTP_404_NOT_FOUND,
            )

        return APIResponse.success(
            message=STATE_SUCCESS['state_retrieved'],
            data=state_data,
            status_code=status.HTTP_200_OK,
        )

    @action(detail=False, methods=['get'], url_path='id/(?P<state_id>[^/.]+)')
    def get_by_id(self, request, state_id=None):
        state_data = PropertyStatePublicService.get_state_detail_by_id_data(state_id)
        if not state_data:
            return APIResponse.error(
                message=STATE_ERRORS['state_not_found'],
                status_code=status.HTTP_404_NOT_FOUND,
            )

        return APIResponse.success(
            message=STATE_SUCCESS['state_retrieved'],
            data=state_data,
            status_code=status.HTTP_200_OK,
        )

    @action(detail=False, methods=['get'], url_path='p/(?P<public_id>[^/.]+)')
    def get_by_public_id(self, request, public_id=None):
        state_data = PropertyStatePublicService.get_state_detail_by_public_id_data(public_id)
        if not state_data:
            return APIResponse.error(
                message=STATE_ERRORS['state_not_found'],
                status_code=status.HTTP_404_NOT_FOUND,
            )

        return APIResponse.success(
            message=STATE_SUCCESS['state_retrieved'],
            data=state_data,
            status_code=status.HTTP_200_OK,
        )

    @action(detail=False, methods=['get'], url_path='featured')
    def featured(self, request):
        limit = self._parse_positive_int(request.query_params.get('limit'), default=3, max_value=24)
        data = PropertyStatePublicService.get_featured_states_data(limit=limit)

        return APIResponse.success(
            message=STATE_SUCCESS['state_list_success'],
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
