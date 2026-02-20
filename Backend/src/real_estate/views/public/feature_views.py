from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny

from src.core.pagination import StandardLimitPagination
from src.core.responses.response import APIResponse
from src.real_estate.messages.messages import FEATURE_ERRORS, FEATURE_SUCCESS
from src.real_estate.serializers.public.taxonomy_serializer import PropertyFeaturePublicSerializer
from src.real_estate.services.public.feature_services import PropertyFeaturePublicService

class PropertyFeaturePublicViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [AllowAny]
    pagination_class = StandardLimitPagination
    serializer_class = PropertyFeaturePublicSerializer
    lookup_field = 'public_id'

    def get_queryset(self):
        filters = {
            'group': self.request.query_params.get('group'),
            'min_property_count': self.request.query_params.get('min_property_count'),
            'parent_id': self.request.query_params.get('parent_id'),
            'parent_public_id': self.request.query_params.get('parent_public_id'),
            'roots_only': self.request.query_params.get('roots_only'),
        }
        filters = {k: v for k, v in filters.items() if v is not None}
        search = self.request.query_params.get('search')
        ordering = self.request.query_params.get('ordering')
        return PropertyFeaturePublicService.get_feature_queryset(filters=filters, search=search, ordering=ordering)

    def list(self, request, *args, **kwargs):
        filters = {
            'group': request.query_params.get('group'),
            'min_property_count': request.query_params.get('min_property_count'),
            'parent_id': request.query_params.get('parent_id'),
            'parent_public_id': request.query_params.get('parent_public_id'),
            'roots_only': request.query_params.get('roots_only'),
        }
        filters = {k: v for k, v in filters.items() if v is not None}
        search = request.query_params.get('search')
        ordering = request.query_params.get('ordering')

        data = PropertyFeaturePublicService.get_feature_list_data(filters=filters, search=search, ordering=ordering)
        page = self.paginate_queryset(data)
        if page is not None:
            return self.get_paginated_response(page)

        return APIResponse.success(
            message=FEATURE_SUCCESS['feature_list_success'],
            data=data,
            status_code=status.HTTP_200_OK,
        )

    def retrieve(self, request, *args, **kwargs):
        feature_data = PropertyFeaturePublicService.get_feature_detail_by_public_id_data(kwargs.get('public_id'))
        if not feature_data:
            return APIResponse.error(
                message=FEATURE_ERRORS['feature_not_found'],
                status_code=status.HTTP_404_NOT_FOUND,
            )

        return APIResponse.success(
            message=FEATURE_SUCCESS['feature_retrieved'],
            data=feature_data,
            status_code=status.HTTP_200_OK,
        )

    @action(detail=False, methods=['get'], url_path='id/(?P<feature_id>[^/.]+)')
    def get_by_id(self, request, feature_id=None):
        feature_data = PropertyFeaturePublicService.get_feature_detail_by_id_data(feature_id)
        if not feature_data:
            return APIResponse.error(
                message=FEATURE_ERRORS['feature_not_found'],
                status_code=status.HTTP_404_NOT_FOUND,
            )

        return APIResponse.success(
            message=FEATURE_SUCCESS['feature_retrieved'],
            data=feature_data,
            status_code=status.HTTP_200_OK,
        )

    @action(detail=False, methods=['get'], url_path='p/(?P<public_id>[^/.]+)')
    def get_by_public_id(self, request, public_id=None):
        feature_data = PropertyFeaturePublicService.get_feature_detail_by_public_id_data(public_id)
        if not feature_data:
            return APIResponse.error(
                message=FEATURE_ERRORS['feature_not_found'],
                status_code=status.HTTP_404_NOT_FOUND,
            )

        return APIResponse.success(
            message=FEATURE_SUCCESS['feature_retrieved'],
            data=feature_data,
            status_code=status.HTTP_200_OK,
        )
