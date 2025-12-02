from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.filters import SearchFilter
from django_filters.rest_framework import DjangoFilterBackend

from src.core.responses.response import APIResponse
from src.blog.messages.messages import CATEGORY_ERRORS, CATEGORY_SUCCESS
from src.blog.serializers.public.category_serializer import BlogCategoryPublicSerializer
from src.blog.services.public.category_services import BlogCategoryPublicService
from src.blog.filters.public.category_filters import BlogCategoryPublicFilter
from src.core.pagination import StandardLimitPagination


class BlogCategoryPublicViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [AllowAny]
    serializer_class = BlogCategoryPublicSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_class = BlogCategoryPublicFilter
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'sort_order', 'blog_count']
    ordering = ['-blog_count', 'sort_order', 'name']
    lookup_field = 'slug'
    pagination_class = StandardLimitPagination

    def get_queryset(self):
        return BlogCategoryPublicService.get_category_queryset()

    def list(self, request, *args, **kwargs):
        tree_mode = request.GET.get('tree', '').lower() == 'true'
        if tree_mode:
            tree_data = BlogCategoryPublicService.get_tree_data()
            serializer = BlogCategoryPublicSerializer(tree_data, many=True)
            return APIResponse.success(
                message=CATEGORY_SUCCESS.get('categories_tree_retrieved', 'Categories tree retrieved successfully'),
                data={'items': serializer.data},
                status_code=status.HTTP_200_OK
            )

        queryset = self.filter_queryset(self.get_queryset())
        
        filters = {
            'name': request.query_params.get('name'),
            'parent_slug': request.query_params.get('parent_slug'),
            'depth': request.query_params.get('depth'),
            'min_blog_count': request.query_params.get('min_blog_count'),
        }
        filters = {k: v for k, v in filters.items() if v is not None}
        
        search = request.query_params.get('search')
        service_queryset = BlogCategoryPublicService.get_category_queryset(filters=filters, search=search)
        
        filtered_ids = list(service_queryset.values_list('id', flat=True))
        queryset = queryset.filter(id__in=filtered_ids)
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = BlogCategoryPublicSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = BlogCategoryPublicSerializer(queryset, many=True)
        return APIResponse.success(
            message=CATEGORY_SUCCESS.get('categories_list_retrieved', 'Categories retrieved successfully'),
            data=serializer.data,
            status_code=status.HTTP_200_OK
        )

    def retrieve(self, request, *args, **kwargs):
        category = BlogCategoryPublicService.get_category_by_slug(kwargs.get('slug'))
        if category:
            serializer = self.get_serializer(category)
            return APIResponse.success(
                message=CATEGORY_SUCCESS.get('category_retrieved', 'Category retrieved successfully'),
                data=serializer.data,
                status_code=status.HTTP_200_OK
            )
        return APIResponse.error(
            message=CATEGORY_ERRORS['category_not_found'],
            status_code=status.HTTP_404_NOT_FOUND
        )

    @action(detail=False, methods=['get'])
    def roots(self, request):
        categories = BlogCategoryPublicService.get_root_categories()
        serializer = BlogCategoryPublicSerializer(categories, many=True)
        return APIResponse.success(
            message=CATEGORY_SUCCESS.get('root_categories_retrieved', 'Root categories retrieved successfully'),
            data=serializer.data,
            status_code=status.HTTP_200_OK
        )