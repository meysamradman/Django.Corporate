from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter

from src.core.pagination import StandardLimitPagination
from src.core.responses.response import APIResponse
from src.portfolio.messages.messages import PORTFOLIO_ERRORS, PORTFOLIO_SUCCESS
from src.portfolio.serializers.public.portfolio_serializer import (
    PortfolioPublicListSerializer,
    PortfolioPublicDetailSerializer
)
from src.portfolio.services.public.portfolio_services import PortfolioPublicService
from src.portfolio.filters.public.portfolio_filters import PortfolioPublicFilter


class PortfolioPublicViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_class = PortfolioPublicFilter
    search_fields = ['title', 'short_description', 'description', 'categories__name', 'tags__name']
    ordering_fields = ['title', 'created_at', 'is_featured']
    ordering = ['-is_featured', '-created_at']
    lookup_field = 'slug'
    pagination_class = StandardLimitPagination

    def get_queryset(self):
        from src.portfolio.models.portfolio import Portfolio
        return Portfolio.objects.published()
    
    def get_serializer_class(self):
        if self.action == 'list':
            return PortfolioPublicListSerializer
        return PortfolioPublicDetailSerializer

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        
        filters = {
            'category_slug': request.query_params.get('category_slug'),
            'tag_slug': request.query_params.get('tag_slug'),
            'is_featured': self._parse_bool(request.query_params.get('is_featured')),
        }
        filters = {k: v for k, v in filters.items() if v is not None}
        
        search = request.query_params.get('search')
        service_queryset = PortfolioPublicService.get_portfolio_queryset(filters=filters, search=search)
        
        filtered_ids = list(service_queryset.values_list('id', flat=True))
        queryset = queryset.filter(id__in=filtered_ids)
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return APIResponse.success(
            message=PORTFOLIO_SUCCESS.get('portfolios_list_retrieved', 'Portfolios retrieved successfully'),
            data=serializer.data,
            status_code=status.HTTP_200_OK
        )

    def retrieve(self, request, *args, **kwargs):
        slug = kwargs.get('slug')
        portfolio = PortfolioPublicService.get_portfolio_by_slug(slug)
        
        if portfolio:
            serializer = self.get_serializer(portfolio)
            return APIResponse.success(
                message=PORTFOLIO_SUCCESS.get('portfolio_retrieved', 'Portfolio retrieved successfully'),
                data=serializer.data,
                status_code=status.HTTP_200_OK
            )
        
        return APIResponse.error(
            message=PORTFOLIO_ERRORS['portfolio_not_found'],
            status_code=status.HTTP_404_NOT_FOUND
        )
        
    @action(detail=False, methods=['get'], url_path='p/(?P<public_id>[^/.]+)')
    def get_by_public_id(self, request, public_id=None):
        portfolio = PortfolioPublicService.get_portfolio_by_public_id(public_id)
        if portfolio:
            serializer = self.get_serializer(portfolio)
            return APIResponse.success(
                message=PORTFOLIO_SUCCESS.get('portfolio_retrieved', 'Portfolio retrieved successfully'),
                data=serializer.data,
                status_code=status.HTTP_200_OK
            )
        
        return APIResponse.error(
            message=PORTFOLIO_ERRORS['portfolio_not_found'],
            status_code=status.HTTP_404_NOT_FOUND
        )
    
    @action(detail=False, methods=['get'])
    def featured(self, request):
        limit = int(request.query_params.get('limit', 6))
        portfolios = PortfolioPublicService.get_featured_portfolios(limit=limit)
        serializer = PortfolioPublicListSerializer(portfolios, many=True)
        return APIResponse.success(
            message=PORTFOLIO_SUCCESS.get('featured_portfolios_retrieved', 'Featured portfolios retrieved successfully'),
            data=serializer.data,
            status_code=status.HTTP_200_OK
        )
    
    @action(detail=True, methods=['get'])
    def related(self, request, slug=None):
        portfolio = PortfolioPublicService.get_portfolio_by_slug(slug)
        if not portfolio:
            return APIResponse.error(
                message=PORTFOLIO_ERRORS['portfolio_not_found'],
                status_code=status.HTTP_404_NOT_FOUND
            )
        
        limit = int(request.query_params.get('limit', 4))
        related_portfolios = PortfolioPublicService.get_related_portfolios(portfolio, limit=limit)
        serializer = PortfolioPublicListSerializer(related_portfolios, many=True)
        return APIResponse.success(
            message=PORTFOLIO_SUCCESS.get('related_portfolios_retrieved', 'Related portfolios retrieved successfully'),
            data=serializer.data,
            status_code=status.HTTP_200_OK
        )
    
    @staticmethod
    def _parse_bool(value):
        if value is None:
            return None
        if isinstance(value, bool):
            return value
        return value.lower() in ('1', 'true', 'yes', 'on')