from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.filters import SearchFilter
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.response import Response

from src.portfolio.messages.messages import CATEGORY_ERRORS, CATEGORY_SUCCESS
from src.portfolio.serializers.public.category_serializer import PortfolioCategoryPublicSerializer
from src.portfolio.services.public.category_services import PortfolioCategoryPublicService
from src.portfolio.filters.public.category_filters import PortfolioCategoryPublicFilter
from src.core.pagination import StandardLimitPagination


class PortfolioCategoryPublicViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [AllowAny]
    serializer_class = PortfolioCategoryPublicSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_class = PortfolioCategoryPublicFilter
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'sort_order', 'portfolio_count']
    ordering = ['-portfolio_count', 'sort_order', 'name']
    lookup_field = 'slug'
    pagination_class = StandardLimitPagination

    def get_queryset(self):
        return PortfolioCategoryPublicService.get_category_queryset()

    def list(self, request, *args, **kwargs):
        """List categories with custom pagination"""
        tree_mode = request.GET.get('tree', '').lower() == 'true'
        if tree_mode:
            tree_data = PortfolioCategoryPublicService.get_tree_data()
            serializer = PortfolioCategoryPublicSerializer(tree_data, many=True)
            return Response({'items': serializer.data})

        # Get base queryset
        queryset = self.filter_queryset(self.get_queryset())
        
        filters = {
            'name': request.query_params.get('name'),
            'parent_slug': request.query_params.get('parent_slug'),
            'depth': request.query_params.get('depth'),
            'min_portfolio_count': request.query_params.get('min_portfolio_count'),
        }
        filters = {k: v for k, v in filters.items() if v is not None}
        
        search = request.query_params.get('search')
        service_queryset = PortfolioCategoryPublicService.get_category_queryset(filters=filters, search=search)
        
        # Intersect the service queryset with the DRF filtered queryset
        filtered_ids = list(service_queryset.values_list('id', flat=True))
        queryset = queryset.filter(id__in=filtered_ids)
        
        # Apply DRF pagination
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = PortfolioCategoryPublicSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = PortfolioCategoryPublicSerializer(queryset, many=True)
        return Response(serializer.data)

    def retrieve(self, request, *args, **kwargs):
        """Get category by slug"""
        category = PortfolioCategoryPublicService.get_category_by_slug(kwargs.get('slug'))
        if category:
            serializer = self.get_serializer(category)
            return Response(serializer.data)
        return Response(
            {"detail": CATEGORY_ERRORS['category_not_found']}, 
            status=status.HTTP_404_NOT_FOUND
        )

    @action(detail=False, methods=['get'])
    def roots(self, request):
        """Get root categories"""
        categories = PortfolioCategoryPublicService.get_root_categories()
        serializer = PortfolioCategoryPublicSerializer(categories, many=True)
        return Response(serializer.data)