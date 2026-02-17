from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny

from src.core.pagination import StandardLimitPagination
from src.core.responses.response import APIResponse
from src.real_estate.messages.messages import LABEL_ERRORS, LABEL_SUCCESS
from src.real_estate.serializers.public.taxonomy_serializer import PropertyLabelPublicSerializer
from src.real_estate.services.public.label_services import PropertyLabelPublicService


class PropertyLabelPublicViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [AllowAny]
    pagination_class = StandardLimitPagination
    lookup_field = 'slug'
    serializer_class = PropertyLabelPublicSerializer

    def get_queryset(self):
        filters = {'min_property_count': self.request.query_params.get('min_property_count')}
        filters = {k: v for k, v in filters.items() if v is not None}
        search = self.request.query_params.get('search')
        ordering = self.request.query_params.get('ordering')
        return PropertyLabelPublicService.get_label_queryset(filters=filters, search=search, ordering=ordering)

    def list(self, request, *args, **kwargs):
        filters = {'min_property_count': request.query_params.get('min_property_count')}
        filters = {k: v for k, v in filters.items() if v is not None}
        search = request.query_params.get('search')
        ordering = request.query_params.get('ordering')

        data = PropertyLabelPublicService.get_label_list_data(filters=filters, search=search, ordering=ordering)
        page = self.paginate_queryset(data)
        if page is not None:
            return self.get_paginated_response(page)

        return APIResponse.success(
            message=LABEL_SUCCESS['label_list_success'],
            data=data,
            status_code=status.HTTP_200_OK,
        )

    def retrieve(self, request, *args, **kwargs):
        label_data = PropertyLabelPublicService.get_label_detail_by_slug_data(kwargs.get('slug'))
        if not label_data:
            return APIResponse.error(
                message=LABEL_ERRORS['label_not_found'],
                status_code=status.HTTP_404_NOT_FOUND,
            )

        return APIResponse.success(
            message=LABEL_SUCCESS['label_retrieved'],
            data=label_data,
            status_code=status.HTTP_200_OK,
        )

    @action(detail=False, methods=['get'], url_path='p/(?P<public_id>[^/.]+)')
    def get_by_public_id(self, request, public_id=None):
        label_data = PropertyLabelPublicService.get_label_detail_by_public_id_data(public_id)
        if not label_data:
            return APIResponse.error(
                message=LABEL_ERRORS['label_not_found'],
                status_code=status.HTTP_404_NOT_FOUND,
            )

        return APIResponse.success(
            message=LABEL_SUCCESS['label_retrieved'],
            data=label_data,
            status_code=status.HTTP_200_OK,
        )
