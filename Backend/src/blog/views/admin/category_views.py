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
from src.user.access_control import blog_permission, PermissionRequiredMixin
from src.core.responses.response import APIResponse
from src.blog.messages.messages import CATEGORY_SUCCESS, CATEGORY_ERRORS


class BlogCategoryAdminViewSet(PermissionRequiredMixin, viewsets.ModelViewSet):
    permission_classes = [blog_permission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = BlogCategoryAdminFilter
    search_fields = ['name', 'description']
    ordering_fields = ['path', 'created_at', 'name']
    ordering = ['path']
    pagination_class = StandardLimitPagination
    
    permission_map = {
        'list': 'blog.category.read',
        'retrieve': 'blog.category.read',
        'create': 'blog.category.create',
        'update': 'blog.category.update',
        'partial_update': 'blog.category.update',
        'destroy': 'blog.category.delete',
        'tree': 'blog.category.read',
    }
    permission_denied_message = CATEGORY_ERRORS["category_not_authorized"]
    
    def get_queryset(self):
        if self.action == 'list':
            return BlogCategoryAdminService.get_tree_queryset()
        elif self.action in ['retrieve', 'update', 'partial_update']:
            return BlogCategoryAdminService.get_tree_queryset()
        else:
            return BlogCategory.objects.all()
    
    def get_serializer_class(self):
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
        tree_mode = request.GET.get('tree', '').lower() == 'true'
        if tree_mode:
            tree_data = BlogCategoryAdminService.get_tree_data()
            return APIResponse.success(
                message=CATEGORY_SUCCESS["category_list_success"],
                data={'data': tree_data},
                status_code=status.HTTP_200_OK
            )

        queryset = self.filter_queryset(BlogCategoryAdminService.get_tree_queryset())
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
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        category = BlogCategoryAdminService.create_category(
            serializer.validated_data,
            created_by=request.user
        )
        detail_serializer = BlogCategoryAdminDetailSerializer(category)
        return APIResponse.success(
            message=CATEGORY_SUCCESS["category_created"],
            data=detail_serializer.data,
            status_code=status.HTTP_201_CREATED
        )
    
    def retrieve(self, request, *args, **kwargs):
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
        partial = kwargs.pop('partial', False)
        category_id = kwargs.get('pk')
        
        serializer = self.get_serializer(data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        try:
            updated_category = BlogCategoryAdminService.update_category_by_id(
                category_id, 
                serializer.validated_data
            )
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
        tree_data = BlogCategoryAdminService.get_tree_data()
        
        return APIResponse.success(
            message=CATEGORY_SUCCESS["category_list_success"],
            data=tree_data,
            status_code=status.HTTP_200_OK
        )
    
    @action(detail=False, methods=['get'])
    def roots(self, request):
        root_categories = BlogCategoryAdminService.get_root_categories()
        
        return APIResponse.success(
            message=CATEGORY_SUCCESS["category_list_success"],
            data=root_categories,
            status_code=status.HTTP_200_OK
        )
    
    @action(detail=True, methods=['get'])
    def children(self, request, pk=None):
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
        limit = int(request.GET.get('limit', 10))
        popular_categories = BlogCategoryAdminService.get_popular_categories(limit)
        
        return APIResponse.success(
            message=CATEGORY_SUCCESS["category_list_success"],
            data=popular_categories,
            status_code=status.HTTP_200_OK
        )
    
    @action(detail=False, methods=['post'], url_path='bulk-delete')
    def bulk_delete(self, request):
        category_ids = request.data.get('ids', [])
        if not category_ids:
            return APIResponse.error(
                message=CATEGORY_ERRORS["category_ids_required"],
                status_code=status.HTTP_400_BAD_REQUEST
            )
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
        stats = BlogCategoryAdminService.get_category_statistics()
        
        return APIResponse.success(
            message=CATEGORY_SUCCESS["category_statistics_retrieved"],
            data=stats,
            status_code=status.HTTP_200_OK
        )
