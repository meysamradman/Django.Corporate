from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.filters import SearchFilter
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.response import Response

from src.portfolio.messages.messages import OPTION_SUCCESS, OPTION_ERRORS
from src.portfolio.serializers.public.option_serializer import PortfolioOptionPublicSerializer
from src.portfolio.services.public.option_services import PortfolioOptionPublicService
from src.portfolio.filters.public.option_filters import PortfolioOptionPublicFilter
from src.core.pagination import StandardLimitPagination


class PortfolioOptionPublicViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [AllowAny]
    serializer_class = PortfolioOptionPublicSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_class = PortfolioOptionPublicFilter
    search_fields = ['key', 'value', 'description']
    ordering_fields = ['key', 'value', 'portfolio_count']
    ordering = ['-portfolio_count', 'key', 'value']
    lookup_field = 'slug'
    pagination_class = StandardLimitPagination

    def get_queryset(self):
        return PortfolioOptionPublicService.get_option_queryset()

    def list(self, request, *args, **kwargs):
        """List options with custom pagination"""
        # Get base queryset
        queryset = self.filter_queryset(self.get_queryset())
        
        filters = {
            'key': request.query_params.get('key'),
            'value': request.query_params.get('value'),
            'min_portfolio_count': request.query_params.get('min_portfolio_count'),
        }
        filters = {k: v for k, v in filters.items() if v is not None}
        
        search = request.query_params.get('search')
        service_queryset = PortfolioOptionPublicService.get_option_queryset(filters=filters, search=search)
        
        # Intersect the service queryset with the DRF filtered queryset
        filtered_ids = list(service_queryset.values_list('id', flat=True))
        queryset = queryset.filter(id__in=filtered_ids)
        
        # Apply DRF pagination
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = PortfolioOptionPublicSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = PortfolioOptionPublicSerializer(queryset, many=True)
        return Response(serializer.data)

    def retrieve(self, request, *args, **kwargs):
        """Get option by slug"""
        option = PortfolioOptionPublicService.get_option_by_slug(kwargs.get("slug"))
        if option:
            serializer = self.get_serializer(option)
            return Response(serializer.data)
        return Response(
            {"detail": OPTION_ERRORS["option_not_found"]}, 
            status=status.HTTP_404_NOT_FOUND
        )

    @action(detail=False, methods=['get'])
    def by_key(self, request):
        """Get options by key"""
        key = request.query_params.get('key')
        if not key:
            return Response(
                {"detail": "Key parameter is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        limit = int(request.query_params.get('limit', 10))
        options = PortfolioOptionPublicService.get_options_by_key(key=key, limit=limit)
        serializer = PortfolioOptionPublicSerializer(options, many=True)
        return Response(serializer.data)