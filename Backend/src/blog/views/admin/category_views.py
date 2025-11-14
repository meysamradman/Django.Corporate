import re
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from django_filters.rest_framework import DjangoFilterBackend
from django.core.exceptions import ValidationError

from src.blog.models.category import BlogCategory
from src.blog.serializers.admin.category_serializer import (
    BlogCategoryAdminListSerializer,
    BlogCategoryAdminDetailSerializer,
    BlogCategoryAdminCreateSerializer,
    BlogCategoryAdminUpdateSerializer,
    BlogCategoryTreeSerializer
)
from src.blog.services.admin.category_services import BlogCategoryAdminService
from src.blog.filters.admin.category_filters import BlogCategoryAdminFilter
from src.core.pagination import StandardLimitPagination
from src.user.authorization.admin_permission import ContentManagerAccess
from src.core.responses.response import APIResponse
from src.blog.messages.messages import CATEGORY_SUCCESS, CATEGORY_ERRORS


class BlogCategoryAdminViewSet(viewsets.ModelViewSet):
    """
    Optimized Category ViewSet for Admin Panel with tree operations
    """
    permission_classes = [ContentManagerAccess]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = BlogCategoryAdminFilter
    search_fields = ['name', 'description']
    ordering_fields = ['path', 'created_at', 'name']
    ordering = ['path']  # Tree order by default
    pagination_class = StandardLimitPagination  # Add DRF pagination
    
    def get_queryset(self):
        """Optimized queryset based on action"""
        if self.action == 'list':
            return BlogCategoryAdminService.get_tree_queryset()
        elif self.action in ['retrieve', 'update', 'partial_update']:
            return BlogCategoryAdminService.get_tree_queryset()
        else:
            return BlogCategory.objects.all()
    
    def get_serializer_class(self):
        """Dynamic serializer selection"""
        if self.action == 'list':
            return BlogCategoryAdminListSerializer
        elif self.action == 'create':
            return BlogCategoryAdminCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return BlogCategoryAdminUpdateSerializer
        elif self.action == 'tree':
            return BlogCategoryTreeSerializer
        else:
            return BlogCategoryAdminDetailSerializer

    def list(self, request, *args, **kwargs):
        """List categories with tree structure and custom pagination"""
        tree_mode = request.GET.get('tree', '').lower() == 'true'
        if tree_mode:
            tree_data = BlogCategoryAdminService.get_tree_data()
            return APIResponse.success(
                message=CATEGORY_SUCCESS["category_list_success"],
                data={'data': tree_data},
                status_code=status.HTTP_200_OK
            )

        # Use the Django Filter backend properly
        queryset = self.filter_queryset(BlogCategoryAdminService.get_tree_queryset())
        
        # Apply DRF pagination
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = BlogCategoryAdminListSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = BlogCategoryAdminListSerializer(queryset, many=True)
        return APIResponse.success(
            message=CATEGORY_SUCCESS["category_list_success"],
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

    def create(self, request, *args, **kwargs):
        """Create category with tree positioning"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Create category using service
        category = BlogCategoryAdminService.create_category(
            serializer.validated_data,
            created_by=request.user
        )
        
        # Return detailed response
        detail_serializer = BlogCategoryAdminDetailSerializer(category)
        return APIResponse.success(
            message=CATEGORY_SUCCESS["category_created"],
            data=detail_serializer.data,
            status_code=status.HTTP_201_CREATED
        )
    
    def retrieve(self, request, *args, **kwargs):
        """Get category detail with tree information"""
        category = BlogCategoryAdminService.get_category_by_id(kwargs.get('pk'))
        
        if not category:
            return APIResponse.error(
                message=CATEGORY_ERRORS["category_not_found"],
                status_code=status.HTTP_404_NOT_FOUND
            )

        serializer = self.get_serializer(category)
        return APIResponse.success(
            message=CATEGORY_SUCCESS["category_retrieved"],
            data=serializer.data,
            status_code=status.HTTP_200_OK
        )

    def update(self, request, *args, **kwargs):
        """Update category with tree operations"""
        partial = kwargs.pop('partial', False)
        category_id = kwargs.get('pk')
        
        serializer = self.get_serializer(data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        
        # Update category using service
        try:
            updated_category = BlogCategoryAdminService.update_category_by_id(
                category_id, 
                serializer.validated_data
            )
            
            # Return detailed response
            detail_serializer = BlogCategoryAdminDetailSerializer(updated_category)
            return APIResponse.success(
                message=CATEGORY_SUCCESS["category_updated"],
                data=detail_serializer.data,
                status_code=status.HTTP_200_OK
            )
        except Exception as e:
            return APIResponse.error(
                message=CATEGORY_ERRORS["category_update_failed"],
                status_code=status.HTTP_400_BAD_REQUEST
            )

    def destroy(self, request, *args, **kwargs):
        """Delete category with safety checks"""
        category_id = kwargs.get('pk')
        
        try:
            BlogCategoryAdminService.delete_category_by_id(category_id)
            return APIResponse.success(
                message=CATEGORY_SUCCESS["category_deleted"],
                status_code=status.HTTP_200_OK
            )
        except BlogCategory.DoesNotExist:
            return APIResponse.error(
                message=CATEGORY_ERRORS["category_not_found"],
                status_code=status.HTTP_404_NOT_FOUND
            )
        except ValidationError as e:
            error_msg = str(e)
            if "blogs" in error_msg:
                count_match = re.search(r'\d+', error_msg)
                count = count_match.group() if count_match else "0"
                message = CATEGORY_ERRORS["category_has_blogs"].format(count=count)
            elif "children" in error_msg:
                count_match = re.search(r'\d+', error_msg)
                count = count_match.group() if count_match else "0"
                message = CATEGORY_ERRORS["category_has_children"].format(count=count)
            else:
                message = CATEGORY_ERRORS["category_delete_failed"]
            return APIResponse.error(
                message=message,
                status_code=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get'])
    def tree(self, request):
        """Get complete category tree"""
        tree_data = BlogCategoryAdminService.get_tree_data()
        
        return APIResponse.success(
            message=CATEGORY_SUCCESS["category_list_success"],
            data=tree_data,
            status_code=status.HTTP_200_OK
        )
    
    @action(detail=False, methods=['get'])
    def roots(self, request):
        """Get root categories only"""
        root_categories = BlogCategoryAdminService.get_root_categories()
        
        return APIResponse.success(
            message=CATEGORY_SUCCESS["category_list_success"],
            data=root_categories,
            status_code=status.HTTP_200_OK
        )
    
    @action(detail=True, methods=['get'])
    def children(self, request, pk=None):
        """Get direct children of a category"""
        category = BlogCategoryAdminService.get_category_by_id(pk)
        
        if not category:
            return APIResponse.error(
                message=CATEGORY_ERRORS["category_not_found"],
                status_code=status.HTTP_404_NOT_FOUND
            )
        
        children = category.get_children().filter(is_active=True)
        serializer = BlogCategoryAdminListSerializer(children, many=True)
        
        return APIResponse.success(
            message=CATEGORY_SUCCESS["category_list_success"],
            data=serializer.data,
            status_code=status.HTTP_200_OK
        )
    
    @action(detail=True, methods=['get'])
    def breadcrumbs(self, request, pk=None):
        """Get category breadcrumbs"""
        category = BlogCategoryAdminService.get_category_by_id(pk)
        
        if not category:
            return APIResponse.error(
                message=CATEGORY_ERRORS["category_not_found"],
                status_code=status.HTTP_404_NOT_FOUND
            )
        
        breadcrumbs = BlogCategoryAdminService.get_breadcrumbs(category)
        
        return APIResponse.success(
            message=CATEGORY_SUCCESS["category_retrieved"],
            data=breadcrumbs,
            status_code=status.HTTP_200_OK
        )
    
    @action(detail=True, methods=['post'])
    def move(self, request, pk=None):
        """Move category to new position"""
        target_id = request.data.get('target_id')
        position = request.data.get('position', 'last-child')
        
        if not target_id:
            return APIResponse.error(
                message=CATEGORY_ERRORS["category_ids_required"],
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            BlogCategoryAdminService.move_category(pk, target_id, position)
            return APIResponse.success(
                message=CATEGORY_SUCCESS["category_moved"],
                status_code=status.HTTP_200_OK
            )
        except BlogCategory.DoesNotExist:
            return APIResponse.error(
                message=CATEGORY_ERRORS["category_not_found"],
                status_code=status.HTTP_404_NOT_FOUND
            )
        except ValidationError as e:
            error_msg = str(e)
            if "descendant" in error_msg.lower():
                message = CATEGORY_ERRORS["category_move_to_descendant"]
            elif "itself" in error_msg.lower():
                message = CATEGORY_ERRORS["category_move_to_self"]
            else:
                message = CATEGORY_ERRORS["category_move_failed"].format(error=error_msg)
            return APIResponse.error(
                message=message,
                status_code=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get'])
    def popular(self, request):
        """Get most popular categories"""
        limit = int(request.GET.get('limit', 10))
        popular_categories = BlogCategoryAdminService.get_popular_categories(limit)
        
        return APIResponse.success(
            message=CATEGORY_SUCCESS["category_list_success"],
            data=popular_categories,
            status_code=status.HTTP_200_OK
        )
    
    @action(detail=False, methods=['post'], url_path='bulk-delete')
    def bulk_delete(self, request):
        """Bulk delete multiple categories"""
        category_ids = request.data.get('ids', [])
        
        if not category_ids:
            return APIResponse.error(
                message=CATEGORY_ERRORS["category_ids_required"],
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        # Convert to list if it's a single value
        if not isinstance(category_ids, list):
            category_ids = [category_ids]
        
        try:
            deleted_count = BlogCategoryAdminService.bulk_delete_categories(category_ids)
            return APIResponse.success(
                message=CATEGORY_SUCCESS["category_bulk_deleted"],
                data={'deleted_count': deleted_count},
                status_code=status.HTTP_200_OK
            )
        except ValidationError as e:
            error_msg = str(e)
            if "not found" in error_msg.lower():
                message = CATEGORY_ERRORS["categories_not_found"]
            else:
                message = CATEGORY_ERRORS["category_delete_failed"]
            return APIResponse.error(
                message=message,
                status_code=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get category statistics for admin dashboard"""
        stats = BlogCategoryAdminService.get_category_statistics()
        
        return APIResponse.success(
            message=CATEGORY_SUCCESS["category_statistics_retrieved"],
            data=stats,
            status_code=status.HTTP_200_OK
        )