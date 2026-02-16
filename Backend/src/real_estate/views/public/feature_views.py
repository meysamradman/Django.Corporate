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
        }
        filters = {k: v for k, v in filters.items() if v is not None}
        search = self.request.query_params.get('search')
        ordering = self.request.query_params.get('ordering')
        return PropertyFeaturePublicService.get_feature_queryset(filters=filters, search=search, ordering=ordering)

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return APIResponse.success(
            message=FEATURE_SUCCESS['feature_list_success'],
            data=serializer.data,
            status_code=status.HTTP_200_OK,
        )

    def retrieve(self, request, *args, **kwargs):
        feature = PropertyFeaturePublicService.get_feature_by_public_id(kwargs.get('public_id'))
        if not feature:
            return APIResponse.error(
                message=FEATURE_ERRORS['feature_not_found'],
                status_code=status.HTTP_404_NOT_FOUND,
            )

        serializer = self.get_serializer(feature)
        return APIResponse.success(
            message=FEATURE_SUCCESS['feature_retrieved'],
            data=serializer.data,
            status_code=status.HTTP_200_OK,
        )

    @action(detail=False, methods=['get'], url_path='p/(?P<public_id>[^/.]+)')
    def get_by_public_id(self, request, public_id=None):
        feature = PropertyFeaturePublicService.get_feature_by_public_id(public_id)
        if not feature:
            return APIResponse.error(
                message=FEATURE_ERRORS['feature_not_found'],
                status_code=status.HTTP_404_NOT_FOUND,
            )

        serializer = self.get_serializer(feature)
        return APIResponse.success(
            message=FEATURE_SUCCESS['feature_retrieved'],
            data=serializer.data,
            status_code=status.HTTP_200_OK,
        )
