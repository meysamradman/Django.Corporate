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
        data = PortfolioOptionPublicService.get_option_list_data(filters=filters, search=search, ordering=ordering)
        
        page = self.paginate_queryset(data)
        if page is not None:
            return self.get_paginated_response(page)
        
        return APIResponse.success(
            message=OPTION_SUCCESS['options_list_retrieved'],
            data=data,
            status_code=status.HTTP_200_OK
        )

    def retrieve(self, request, *args, **kwargs):
        option_data = PortfolioOptionPublicService.get_option_detail_by_slug_data(kwargs.get("slug"))
        if option_data:
            return APIResponse.success(
                message=OPTION_SUCCESS['option_retrieved'],
                data=option_data,
                status_code=status.HTTP_200_OK
            )
        return APIResponse.error(
            message=OPTION_ERRORS["option_not_found"],
            status_code=status.HTTP_404_NOT_FOUND
        )

    @action(detail=False, methods=['get'], url_path='p/(?P<public_id>[^/.]+)')
    def get_by_public_id(self, request, public_id=None):
        option_data = PortfolioOptionPublicService.get_option_detail_by_public_id_data(public_id)
        if option_data:
            return APIResponse.success(
                message=OPTION_SUCCESS['option_retrieved'],
                data=option_data,
                status_code=status.HTTP_200_OK,
            )

        return APIResponse.error(
            message=OPTION_ERRORS['option_not_found'],
            status_code=status.HTTP_404_NOT_FOUND,
        )

    @action(detail=False, methods=['get'], url_path='id/(?P<option_id>[^/.]+)')
    def get_by_id(self, request, option_id=None):
        try:
            parsed_id = int(option_id)
        except (TypeError, ValueError):
            return APIResponse.error(
                message=OPTION_ERRORS['option_not_found'],
                status_code=status.HTTP_404_NOT_FOUND,
            )

        option_data = PortfolioOptionPublicService.get_option_detail_by_id_data(parsed_id)
        if option_data:
            return APIResponse.success(
                message=OPTION_SUCCESS['option_retrieved'],
                data=option_data,
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
        data = PortfolioOptionPublicService.get_options_by_name_data(name=name, limit=limit)
        return APIResponse.success(
            message=OPTION_SUCCESS['options_by_name_retrieved'],
            data=data,
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