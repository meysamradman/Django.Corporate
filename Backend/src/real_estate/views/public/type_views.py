from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny

from src.core.pagination import StandardLimitPagination
from src.core.responses.response import APIResponse
from src.real_estate.messages.messages import TYPE_ERRORS, TYPE_SUCCESS
from src.real_estate.serializers.public.taxonomy_serializer import PropertyTypePublicSerializer
from src.real_estate.services.public.type_services import PropertyTypePublicService


class PropertyTypePublicViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [AllowAny]
    pagination_class = StandardLimitPagination
    lookup_field = 'slug'
    serializer_class = PropertyTypePublicSerializer

    def get_queryset(self):
        filters = {
            'root_only': self._parse_bool(self.request.query_params.get('root_only')),
            'min_property_count': self.request.query_params.get('min_property_count'),
        }
        filters = {k: v for k, v in filters.items() if v is not None}
        search = self.request.query_params.get('search')
        ordering = self.request.query_params.get('ordering')
        return PropertyTypePublicService.get_type_queryset(filters=filters, search=search, ordering=ordering)

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return APIResponse.success(
            message=TYPE_SUCCESS['type_list_success'],
            data=serializer.data,
            status_code=status.HTTP_200_OK,
        )

    def retrieve(self, request, *args, **kwargs):
        property_type = PropertyTypePublicService.get_type_by_slug(kwargs.get('slug'))
        if not property_type:
            return APIResponse.error(
                message=TYPE_ERRORS['type_not_found'],
                status_code=status.HTTP_404_NOT_FOUND,
            )

        serializer = self.get_serializer(property_type)
        return APIResponse.success(
            message=TYPE_SUCCESS['type_retrieved'],
            data=serializer.data,
            status_code=status.HTTP_200_OK,
        )

    @action(detail=False, methods=['get'], url_path='p/(?P<public_id>[^/.]+)')
    def get_by_public_id(self, request, public_id=None):
        property_type = PropertyTypePublicService.get_type_by_public_id(public_id)
        if not property_type:
            return APIResponse.error(
                message=TYPE_ERRORS['type_not_found'],
                status_code=status.HTTP_404_NOT_FOUND,
            )

        serializer = self.get_serializer(property_type)
        return APIResponse.success(
            message=TYPE_SUCCESS['type_retrieved'],
            data=serializer.data,
            status_code=status.HTTP_200_OK,
        )

    @action(detail=False, methods=['get'])
    def roots(self, request):
        roots = PropertyTypePublicService.get_root_types()
        serializer = self.get_serializer(roots, many=True)
        return APIResponse.success(
            message=TYPE_SUCCESS['type_list_success'],
            data=serializer.data,
            status_code=status.HTTP_200_OK,
        )

    @action(detail=False, methods=['get'])
    def tree(self, request):
        tree_queryset = PropertyTypePublicService.get_tree_queryset()
        serializer = self.get_serializer(tree_queryset, many=True)
        return APIResponse.success(
            message=TYPE_SUCCESS['type_list_success'],
            data=serializer.data,
            status_code=status.HTTP_200_OK,
        )

    @action(detail=False, methods=['get'])
    def popular(self, request):
        limit = self._parse_positive_int(request.query_params.get('limit'), default=10, max_value=50)
        queryset = PropertyTypePublicService.get_popular_types(limit=limit)
        serializer = self.get_serializer(queryset, many=True)
        return APIResponse.success(
            message=TYPE_SUCCESS['type_list_success'],
            data=serializer.data,
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
