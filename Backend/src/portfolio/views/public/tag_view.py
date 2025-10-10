from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.filters import SearchFilter
from django_filters.rest_framework import DjangoFilterBackend
from django.core.paginator import Paginator

from src.core.responses.response import APIResponse
from src.portfolio.messages.messages import TAG_SUCCESS, TAG_ERRORS
from src.portfolio.serializers.public.tag_serializer import PortfolioTagPublicSerializer
from src.portfolio.services.public.tag_services import PortfolioTagPublicService
from src.portfolio.filters.public.tag_filters import PortfolioTagPublicFilter


class PortfolioTagPublicViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [AllowAny]
    serializer_class = PortfolioTagPublicSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_class = PortfolioTagPublicFilter
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'portfolio_count']
    ordering = ['-portfolio_count', 'name']
    lookup_field = 'slug'

    def get_queryset(self):
        return PortfolioTagPublicService.get_tag_queryset()

    def list(self, request, *args, **kwargs):
        """List tags with custom pagination"""
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 20))
        
        filters = {
            'name': request.query_params.get('name'),
            'min_portfolio_count': request.query_params.get('min_portfolio_count'),
        }
        filters = {k: v for k, v in filters.items() if v is not None}
        
        search = request.query_params.get('search')
        queryset = PortfolioTagPublicService.get_tag_queryset(filters=filters, search=search)
        
        paginator = Paginator(queryset, page_size)
        page_obj = paginator.get_page(page)
        
        serializer = PortfolioTagPublicSerializer(page_obj.object_list, many=True)
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
        return APIResponse.success(data=data, message="Tag list retrieved successfully.")

    def retrieve(self, request, *args, **kwargs):
        """Get tag by slug"""
        tag = PortfolioTagPublicService.get_tag_by_slug(kwargs.get("slug"))
        if tag:
            serializer = self.get_serializer(tag)
            return APIResponse.success(message=TAG_SUCCESS["tag_retrieved"], data=serializer.data)
        return APIResponse.error(TAG_ERRORS["tag_not_found"], status_code=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['get'])
    def popular(self, request):
        """Get popular tags"""
        limit = int(request.query_params.get('limit', 10))
        tags = PortfolioTagPublicService.get_popular_tags(limit=limit)
        serializer = PortfolioTagPublicSerializer(tags, many=True)
        return APIResponse.success(data=serializer.data, message="Popular tags retrieved successfully.")




