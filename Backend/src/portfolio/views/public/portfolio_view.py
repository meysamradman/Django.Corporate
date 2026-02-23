from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny

from src.core.pagination import StandardLimitPagination
from src.core.responses.response import APIResponse
from src.portfolio.messages.messages import PORTFOLIO_ERRORS, PORTFOLIO_SUCCESS
from src.portfolio.services.public.portfolio_services import PortfolioPublicService
from src.portfolio.serializers.public.portfolio_serializer import (
    PortfolioPublicListSerializer,
    PortfolioPublicDetailSerializer,
)

class PortfolioPublicViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [AllowAny]
    lookup_field = 'slug'
    pagination_class = StandardLimitPagination

    def get_queryset(self):
        return PortfolioPublicService.get_portfolio_queryset()
    
    def get_serializer_class(self):
        if self.action == 'list':
            return PortfolioPublicListSerializer
        return PortfolioPublicDetailSerializer

    def list(self, request, *args, **kwargs):
        filters = {
            'category_slug': request.query_params.get('category_slug'),
            'tag_slug': request.query_params.get('tag_slug'),
            'option_slug': request.query_params.get('option_slug'),
            'is_featured': self._parse_bool(request.query_params.get('is_featured')),
            'created_after': request.query_params.get('created_after'),
            'created_before': request.query_params.get('created_before'),
        }
        filters = {k: v for k, v in filters.items() if v is not None}
        
        search = request.query_params.get('search')
        ordering = request.query_params.get('ordering')
        data = PortfolioPublicService.get_portfolio_list_data(filters=filters, search=search, ordering=ordering)
        
        page = self.paginate_queryset(data)
        if page is not None:
            return self.get_paginated_response(page)
        
        return APIResponse.success(
            message=PORTFOLIO_SUCCESS['portfolio_list_success'],
            data=data,
            status_code=status.HTTP_200_OK
        )

    def retrieve(self, request, *args, **kwargs):
        slug = kwargs.get('slug')
        portfolio_data = PortfolioPublicService.get_portfolio_detail_by_slug_data(slug)
        
        if portfolio_data:
            return APIResponse.success(
                message=PORTFOLIO_SUCCESS['portfolio_retrieved'],
                data=portfolio_data,
                status_code=status.HTTP_200_OK
            )
        
        return APIResponse.error(
            message=PORTFOLIO_ERRORS['portfolio_not_found'],
            status_code=status.HTTP_404_NOT_FOUND
        )
        
    @action(detail=False, methods=['get'], url_path='p/(?P<public_id>[^/.]+)')
    def get_by_public_id(self, request, public_id=None):
        portfolio_data = PortfolioPublicService.get_portfolio_detail_by_public_id_data(public_id)
        if portfolio_data:
            return APIResponse.success(
                message=PORTFOLIO_SUCCESS['portfolio_retrieved'],
                data=portfolio_data,
                status_code=status.HTTP_200_OK
            )
        
        return APIResponse.error(
            message=PORTFOLIO_ERRORS['portfolio_not_found'],
            status_code=status.HTTP_404_NOT_FOUND
        )

    @action(detail=False, methods=['get'], url_path='id/(?P<portfolio_id>[^/.]+)')
    def get_by_id(self, request, portfolio_id=None):
        try:
            parsed_id = int(portfolio_id)
        except (TypeError, ValueError):
            return APIResponse.error(
                message=PORTFOLIO_ERRORS['portfolio_not_found'],
                status_code=status.HTTP_404_NOT_FOUND,
            )

        portfolio_data = PortfolioPublicService.get_portfolio_detail_by_id_data(parsed_id)
        if portfolio_data:
            return APIResponse.success(
                message=PORTFOLIO_SUCCESS['portfolio_retrieved'],
                data=portfolio_data,
                status_code=status.HTTP_200_OK,
            )

        return APIResponse.error(
            message=PORTFOLIO_ERRORS['portfolio_not_found'],
            status_code=status.HTTP_404_NOT_FOUND,
        )
    
    @action(detail=False, methods=['get'])
    def featured(self, request):
        limit = self._parse_positive_int(request.query_params.get('limit'), default=6, max_value=24)
        data = PortfolioPublicService.get_featured_portfolios_data(limit=limit)
        return APIResponse.success(
            message=PORTFOLIO_SUCCESS['featured_portfolios_retrieved'],
            data=data,
            status_code=status.HTTP_200_OK
        )
    
    @action(detail=True, methods=['get'])
    def related(self, request, slug=None):
        limit = self._parse_positive_int(request.query_params.get('limit'), default=4, max_value=24)
        data = PortfolioPublicService.get_related_portfolios_by_slug_data(slug=slug, limit=limit)
        if data is None:
            return APIResponse.error(
                message=PORTFOLIO_ERRORS['portfolio_not_found'],
                status_code=status.HTTP_404_NOT_FOUND
            )

        return APIResponse.success(
            message=PORTFOLIO_SUCCESS['related_portfolios_retrieved'],
            data=data,
            status_code=status.HTTP_200_OK
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