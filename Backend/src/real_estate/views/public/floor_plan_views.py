from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny

from src.core.pagination import StandardLimitPagination
from src.core.responses.response import APIResponse
from src.real_estate.messages.messages import FLOOR_PLAN_ERRORS, FLOOR_PLAN_SUCCESS
from src.real_estate.serializers.public.floor_plan_serializer import FloorPlanPublicListSerializer
from src.real_estate.services.public.floor_plan_services import FloorPlanPublicService


class FloorPlanPublicViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [AllowAny]
    pagination_class = StandardLimitPagination
    serializer_class = FloorPlanPublicListSerializer
    lookup_field = 'slug'

    def get_queryset(self):
        filters = {
            'property_id': self.request.query_params.get('property_id'),
            'is_available': self.request.query_params.get('is_available'),
            'min_floor_size': self.request.query_params.get('min_floor_size'),
            'max_floor_size': self.request.query_params.get('max_floor_size'),
            'min_price': self.request.query_params.get('min_price'),
            'max_price': self.request.query_params.get('max_price'),
        }
        filters = {k: v for k, v in filters.items() if v is not None}

        search = self.request.query_params.get('search')
        ordering = self.request.query_params.get('ordering')

        return FloorPlanPublicService.get_floor_plan_queryset(filters=filters, search=search, ordering=ordering)

    def list(self, request, *args, **kwargs):
        filters = {
            'property_id': request.query_params.get('property_id'),
            'is_available': request.query_params.get('is_available'),
            'min_floor_size': request.query_params.get('min_floor_size'),
            'max_floor_size': request.query_params.get('max_floor_size'),
            'min_price': request.query_params.get('min_price'),
            'max_price': request.query_params.get('max_price'),
        }
        filters = {k: v for k, v in filters.items() if v is not None}

        search = request.query_params.get('search')
        ordering = request.query_params.get('ordering')

        data = FloorPlanPublicService.get_floor_plan_list_data(filters=filters, search=search, ordering=ordering)

        page = self.paginate_queryset(data)
        if page is not None:
            return self.get_paginated_response(page)

        return APIResponse.success(
            message=FLOOR_PLAN_SUCCESS['floor_plan_list_success'],
            data=data,
            status_code=status.HTTP_200_OK,
        )

    def retrieve(self, request, *args, **kwargs):
        floor_plan_data = FloorPlanPublicService.get_floor_plan_detail_by_slug_data(kwargs.get('slug'))
        if not floor_plan_data:
            return APIResponse.error(
                message=FLOOR_PLAN_ERRORS['floor_plan_not_found'],
                status_code=status.HTTP_404_NOT_FOUND,
            )

        return APIResponse.success(
            message=FLOOR_PLAN_SUCCESS['floor_plan_retrieved'],
            data=floor_plan_data,
            status_code=status.HTTP_200_OK,
        )

    @action(detail=False, methods=['get'], url_path='id/(?P<floor_plan_id>[^/.]+)')
    def get_by_id(self, request, floor_plan_id=None):
        floor_plan_data = FloorPlanPublicService.get_floor_plan_detail_by_id_data(floor_plan_id)
        if not floor_plan_data:
            return APIResponse.error(
                message=FLOOR_PLAN_ERRORS['floor_plan_not_found'],
                status_code=status.HTTP_404_NOT_FOUND,
            )

        return APIResponse.success(
            message=FLOOR_PLAN_SUCCESS['floor_plan_retrieved'],
            data=floor_plan_data,
            status_code=status.HTTP_200_OK,
        )

    @action(detail=False, methods=['get'], url_path='p/(?P<public_id>[^/.]+)')
    def get_by_public_id(self, request, public_id=None):
        floor_plan_data = FloorPlanPublicService.get_floor_plan_detail_by_public_id_data(public_id)
        if not floor_plan_data:
            return APIResponse.error(
                message=FLOOR_PLAN_ERRORS['floor_plan_not_found'],
                status_code=status.HTTP_404_NOT_FOUND,
            )

        return APIResponse.success(
            message=FLOOR_PLAN_SUCCESS['floor_plan_retrieved'],
            data=floor_plan_data,
            status_code=status.HTTP_200_OK,
        )
