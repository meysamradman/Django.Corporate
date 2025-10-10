from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.filters import SearchFilter
from django_filters.rest_framework import DjangoFilterBackend
from django.core.paginator import Paginator

from src.core.responses.response import APIResponse
from src.portfolio.messages.messages import CATEGORY_ERRORS, CATEGORY_SUCCESS
from src.portfolio.serializers.public.category_serializer import PortfolioCategoryPublicSerializer
from src.portfolio.services.public.category_services import PortfolioCategoryPublicService
from src.portfolio.filters.public.category_filters import PortfolioCategoryPublicFilter


class PortfolioCategoryPublicViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [AllowAny]
    serializer_class = PortfolioCategoryPublicSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_class = PortfolioCategoryPublicFilter
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'sort_order', 'portfolio_count']
    ordering = ['-portfolio_count', 'sort_order', 'name']
    lookup_field = 'slug'

    def get_queryset(self):
        return PortfolioCategoryPublicService.get_category_queryset()

    def list(self, request, *args, **kwargs):
        """List categories with custom pagination"""
        tree_mode = request.GET.get('tree', '').lower() == 'true'
        if tree_mode:
            tree_data = PortfolioCategoryPublicService.get_tree_data()
            serializer = PortfolioCategoryPublicSerializer(tree_data, many=True)
            return APIResponse.success(
                data={'items': serializer.data, 'pagination': None},
                message="Category tree retrieved successfully."
            )

        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 20))
        
        filters = {
            'name': request.query_params.get('name'),
            'parent_slug': request.query_params.get('parent_slug'),
            'depth': request.query_params.get('depth'),
            'min_portfolio_count': request.query_params.get('min_portfolio_count'),
        }
        filters = {k: v for k, v in filters.items() if v is not None}
        
        search = request.query_params.get('search')
        queryset = PortfolioCategoryPublicService.get_category_queryset(filters=filters, search=search)
        
        paginator = Paginator(queryset, page_size)
        page_obj = paginator.get_page(page)
        
        serializer = PortfolioCategoryPublicSerializer(page_obj.object_list, many=True)
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
        return APIResponse.success(data=data, message="Category list retrieved successfully.")

    def retrieve(self, request, *args, **kwargs):
        """Get category by slug"""
        category = PortfolioCategoryPublicService.get_category_by_slug(kwargs.get('slug'))
        if category:
            serializer = self.get_serializer(category)
            return APIResponse.success(message=CATEGORY_SUCCESS['category_retrieved'], data=serializer.data)
        return APIResponse.error(CATEGORY_ERRORS['category_not_found'], status_code=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['get'])
    def roots(self, request):
        """Get root categories"""
        categories = PortfolioCategoryPublicService.get_root_categories()
        serializer = PortfolioCategoryPublicSerializer(categories, many=True)
        return APIResponse.success(data=serializer.data, message="Root categories retrieved successfully.")




