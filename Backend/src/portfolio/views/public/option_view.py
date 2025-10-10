from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.filters import SearchFilter
from django_filters.rest_framework import DjangoFilterBackend
from django.core.paginator import Paginator

from src.core.responses.response import APIResponse
from src.portfolio.messages.messages import OPTION_SUCCESS, OPTION_ERRORS
from src.portfolio.serializers.public.option_serializer import PortfolioOptionPublicSerializer
from src.portfolio.services.public.option_services import PortfolioOptionPublicService
from src.portfolio.filters.public.option_filters import PortfolioOptionPublicFilter


class PortfolioOptionPublicViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [AllowAny]
    serializer_class = PortfolioOptionPublicSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_class = PortfolioOptionPublicFilter
    search_fields = ['key', 'value', 'description']
    ordering_fields = ['key', 'value', 'portfolio_count']
    ordering = ['-portfolio_count', 'key', 'value']
    lookup_field = 'slug'

    def get_queryset(self):
        return PortfolioOptionPublicService.get_option_queryset()

    def list(self, request, *args, **kwargs):
        """List options with custom pagination"""
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 20))
        
        filters = {
            'key': request.query_params.get('key'),
            'value': request.query_params.get('value'),
            'min_portfolio_count': request.query_params.get('min_portfolio_count'),
        }
        filters = {k: v for k, v in filters.items() if v is not None}
        
        search = request.query_params.get('search')
        queryset = PortfolioOptionPublicService.get_option_queryset(filters=filters, search=search)
        
        paginator = Paginator(queryset, page_size)
        page_obj = paginator.get_page(page)
        
        serializer = PortfolioOptionPublicSerializer(page_obj.object_list, many=True)
        data = {
            'items': serializer.data,
            'pagination': {
                'total_count': paginator.count,
                'page_count': paginator.num_pages,
                'current_page': page_obj.number,
                'has_next': page_obj.has_next(),
                'has_previous': page_obj.has_previous(),
                'page_size': page_size,
            }
        }
        return APIResponse.success(data=data, message="Option list retrieved successfully.")

    def retrieve(self, request, *args, **kwargs):
        """Get option by slug"""
        option = PortfolioOptionPublicService.get_option_by_slug(kwargs.get("slug"))
        if option:
            serializer = self.get_serializer(option)
            return APIResponse.success(message=OPTION_SUCCESS["option_retrieved"], data=serializer.data)
        return APIResponse.error(OPTION_ERRORS["option_not_found"], status_code=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['get'])
    def by_key(self, request):
        """Get options by key"""
        key = request.query_params.get('key')
        if not key:
            return APIResponse.error("Key parameter is required", status_code=status.HTTP_400_BAD_REQUEST)
        
        limit = int(request.query_params.get('limit', 10))
        options = PortfolioOptionPublicService.get_options_by_key(key=key, limit=limit)
        serializer = PortfolioOptionPublicSerializer(options, many=True)
        return APIResponse.success(data=serializer.data, message=f"Options for key '{key}' retrieved successfully.")




