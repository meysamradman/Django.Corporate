from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny

from src.core.responses.response import APIResponse
from src.portfolio.messages.messages import OPTION_SUCCESS, OPTION_ERRORS
from src.portfolio.serializers.public.option_serializer import PortfolioOptionPublicSerializer
from src.portfolio.services.public.option_services import PortfolioOptionPublicService
from src.core.pagination import StandardLimitPagination

class PortfolioOptionPublicViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [AllowAny]
    serializer_class = PortfolioOptionPublicSerializer
    lookup_field = 'slug'
    pagination_class = StandardLimitPagination

    def get_queryset(self):
        return PortfolioOptionPublicService.get_option_queryset()

    def list(self, request, *args, **kwargs):
        filters = {
            'name': request.query_params.get('name'),
            'min_portfolio_count': request.query_params.get('min_portfolio_count'),
        }
        filters = {k: v for k, v in filters.items() if v is not None}
        
        search = request.query_params.get('search')
        ordering = request.query_params.get('ordering')
        queryset = PortfolioOptionPublicService.get_option_queryset(filters=filters, search=search, ordering=ordering)
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = PortfolioOptionPublicSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = PortfolioOptionPublicSerializer(queryset, many=True)
        return APIResponse.success(
            message=OPTION_SUCCESS['options_list_retrieved'],
            data=serializer.data,
            status_code=status.HTTP_200_OK
        )

    def retrieve(self, request, *args, **kwargs):
        option = PortfolioOptionPublicService.get_option_by_slug(kwargs.get("slug"))
        if option:
            serializer = self.get_serializer(option)
            return APIResponse.success(
                message=OPTION_SUCCESS['option_retrieved'],
                data=serializer.data,
                status_code=status.HTTP_200_OK
            )
        return APIResponse.error(
            message=OPTION_ERRORS["option_not_found"],
            status_code=status.HTTP_404_NOT_FOUND
        )

    @action(detail=False, methods=['get'], url_path='p/(?P<public_id>[^/.]+)')
    def get_by_public_id(self, request, public_id=None):
        option = PortfolioOptionPublicService.get_option_by_public_id(public_id)
        if option:
            serializer = self.get_serializer(option)
            return APIResponse.success(
                message=OPTION_SUCCESS['option_retrieved'],
                data=serializer.data,
                status_code=status.HTTP_200_OK,
            )

        return APIResponse.error(
            message=OPTION_ERRORS['option_not_found'],
            status_code=status.HTTP_404_NOT_FOUND,
        )

    @action(detail=False, methods=['get'])
    def by_name(self, request):
        name = request.query_params.get('name')
        if not name:
            return APIResponse.error(
                message=OPTION_ERRORS['validation_error'],
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        limit = self._parse_positive_int(request.query_params.get('limit'), default=10, max_value=50)
        options = PortfolioOptionPublicService.get_options_by_name(name=name, limit=limit)
        serializer = PortfolioOptionPublicSerializer(options, many=True)
        return APIResponse.success(
            message=OPTION_SUCCESS['options_by_name_retrieved'],
            data=serializer.data,
            status_code=status.HTTP_200_OK
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