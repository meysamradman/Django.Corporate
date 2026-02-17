from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny

from src.core.pagination import StandardLimitPagination
from src.core.responses.response import APIResponse
from src.real_estate.messages.messages import TAG_ERRORS, TAG_SUCCESS
from src.real_estate.serializers.public.taxonomy_serializer import PropertyTagPublicSerializer
from src.real_estate.services.public.tag_services import PropertyTagPublicService

class PropertyTagPublicViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [AllowAny]
    pagination_class = StandardLimitPagination
    lookup_field = 'slug'
    serializer_class = PropertyTagPublicSerializer

    def get_queryset(self):
        filters = {'min_property_count': self.request.query_params.get('min_property_count')}
        filters = {k: v for k, v in filters.items() if v is not None}
        search = self.request.query_params.get('search')
        ordering = self.request.query_params.get('ordering')
        return PropertyTagPublicService.get_tag_queryset(filters=filters, search=search, ordering=ordering)

    def list(self, request, *args, **kwargs):
        filters = {'min_property_count': request.query_params.get('min_property_count')}
        filters = {k: v for k, v in filters.items() if v is not None}
        search = request.query_params.get('search')
        ordering = request.query_params.get('ordering')

        data = PropertyTagPublicService.get_tag_list_data(filters=filters, search=search, ordering=ordering)
        page = self.paginate_queryset(data)
        if page is not None:
            return self.get_paginated_response(page)

        return APIResponse.success(
            message=TAG_SUCCESS['tag_list_success'],
            data=data,
            status_code=status.HTTP_200_OK,
        )

    def retrieve(self, request, *args, **kwargs):
        tag_data = PropertyTagPublicService.get_tag_detail_by_slug_data(kwargs.get('slug'))
        if not tag_data:
            return APIResponse.error(
                message=TAG_ERRORS['tag_not_found'],
                status_code=status.HTTP_404_NOT_FOUND,
            )

        return APIResponse.success(
            message=TAG_SUCCESS['tag_retrieved'],
            data=tag_data,
            status_code=status.HTTP_200_OK,
        )

    @action(detail=False, methods=['get'], url_path='id/(?P<tag_id>[^/.]+)')
    def get_by_id(self, request, tag_id=None):
        tag_data = PropertyTagPublicService.get_tag_detail_by_id_data(tag_id)
        if not tag_data:
            return APIResponse.error(
                message=TAG_ERRORS['tag_not_found'],
                status_code=status.HTTP_404_NOT_FOUND,
            )

        return APIResponse.success(
            message=TAG_SUCCESS['tag_retrieved'],
            data=tag_data,
            status_code=status.HTTP_200_OK,
        )

    @action(detail=False, methods=['get'], url_path='p/(?P<public_id>[^/.]+)')
    def get_by_public_id(self, request, public_id=None):
        tag_data = PropertyTagPublicService.get_tag_detail_by_public_id_data(public_id)
        if not tag_data:
            return APIResponse.error(
                message=TAG_ERRORS['tag_not_found'],
                status_code=status.HTTP_404_NOT_FOUND,
            )

        return APIResponse.success(
            message=TAG_SUCCESS['tag_retrieved'],
            data=tag_data,
            status_code=status.HTTP_200_OK,
        )

    @action(detail=False, methods=['get'])
    def popular(self, request):
        limit = self._parse_positive_int(request.query_params.get('limit'), default=10, max_value=50)
        data = PropertyTagPublicService.get_popular_tags_data(limit=limit)
        return APIResponse.success(
            message=TAG_SUCCESS['tag_list_success'],
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
