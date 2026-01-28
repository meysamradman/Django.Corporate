from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.filters import SearchFilter
from django_filters.rest_framework import DjangoFilterBackend

from src.core.responses.response import APIResponse
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
    search_fields = ['name', 'slug', 'description']
    ordering_fields = ['name', 'slug', 'portfolio_count']
    ordering = ['-portfolio_count', 'name']
    lookup_field = 'slug'
    pagination_class = StandardLimitPagination

    def get_queryset(self):
        return PortfolioOptionPublicService.get_option_queryset()

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        
        filters = {
            'name': request.query_params.get('name'),
            'min_portfolio_count': request.query_params.get('min_portfolio_count'),
        }
        filters = {k: v for k, v in filters.items() if v is not None}
        
        search = request.query_params.get('search')
        service_queryset = PortfolioOptionPublicService.get_option_queryset(filters=filters, search=search)
        
        filtered_ids = list(service_queryset.values_list('id', flat=True))
        queryset = queryset.filter(id__in=filtered_ids)
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = PortfolioOptionPublicSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = PortfolioOptionPublicSerializer(queryset, many=True)
        return APIResponse.success(
            message=OPTION_SUCCESS.get('options_list_retrieved', 'Options retrieved successfully'),
            data=serializer.data,
            status_code=status.HTTP_200_OK
        )

    def retrieve(self, request, *args, **kwargs):
        option = PortfolioOptionPublicService.get_option_by_slug(kwargs.get("slug"))
        if option:
            serializer = self.get_serializer(option)
            return APIResponse.success(
                message=OPTION_SUCCESS.get('option_retrieved', 'Option retrieved successfully'),
                data=serializer.data,
                status_code=status.HTTP_200_OK
            )
        return APIResponse.error(
            message=OPTION_ERRORS["option_not_found"],
            status_code=status.HTTP_404_NOT_FOUND
        )

    @action(detail=False, methods=['get'])
    def by_name(self, request):
        name = request.query_params.get('name')
        if not name:
            return APIResponse.error(
                message=OPTION_ERRORS.get('validation_error', 'Name parameter is required'),
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        limit = int(request.query_params.get('limit', 10))
        options = PortfolioOptionPublicService.get_options_by_name(name=name, limit=limit)
        serializer = PortfolioOptionPublicSerializer(options, many=True)
        return APIResponse.success(
            message=OPTION_SUCCESS.get('options_by_name_retrieved', 'Options retrieved successfully'),
            data=serializer.data,
            status_code=status.HTTP_200_OK
        )