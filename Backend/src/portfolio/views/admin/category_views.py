import re
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from django_filters.rest_framework import DjangoFilterBackend
from django.core.exceptions import ValidationError

from src.portfolio.models.category import PortfolioCategory
from src.portfolio.serializers.admin.category_serializer import (
    PortfolioCategoryAdminListSerializer,
    PortfolioCategoryAdminDetailSerializer,
    PortfolioCategoryAdminCreateSerializer,
    PortfolioCategoryAdminUpdateSerializer,
    PortfolioCategoryTreeSerializer
)
from src.portfolio.services.admin.category_services import PortfolioCategoryAdminService
from src.portfolio.filters.admin.category_filters import PortfolioCategoryAdminFilter
from src.core.pagination import StandardLimitPagination
from src.user.authorization.admin_permission import PortfolioManagerAccess
from src.core.responses.response import APIResponse
from src.portfolio.messages.messages import CATEGORY_SUCCESS, CATEGORY_ERRORS
from src.user.permissions import PermissionValidator


class PortfolioCategoryAdminViewSet(viewsets.ModelViewSet):
    """
    Optimized Category ViewSet for Admin Panel with tree operations
    """
    permission_classes = [PortfolioManagerAccess]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = PortfolioCategoryAdminFilter
    search_fields = ['name', 'description']
    ordering_fields = ['path', 'created_at', 'name']
    ordering = ['path']  # Tree order by default
    pagination_class = StandardLimitPagination  # Add DRF pagination
    
    def get_queryset(self):
        """Optimized queryset based on action"""
        if self.action == 'list':
            return PortfolioCategoryAdminService.get_tree_queryset()
        elif self.action in ['retrieve', 'update', 'partial_update']:
            return PortfolioCategoryAdminService.get_tree_queryset()
        else:
            return PortfolioCategory.objects.all()
    
    def get_serializer_class(self):
        """Dynamic serializer selection"""
        if self.action == 'list':
            return PortfolioCategoryAdminListSerializer
        elif self.action == 'create':
            return PortfolioCategoryAdminCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return PortfolioCategoryAdminUpdateSerializer
        elif self.action == 'tree':
            return PortfolioCategoryTreeSerializer
        else:
            return PortfolioCategoryAdminDetailSerializer

    def list(self, request, *args, **kwargs):
        """List categories with tree structure and custom pagination"""
        if not PermissionValidator.has_permission(request.user, 'portfolio.category.read'):
            return APIResponse.error(
                message=CATEGORY_ERRORS.get("category_not_authorized", "You don't have permission to view portfolio categories"),
                status_code=status.HTTP_403_FORBIDDEN
            )
        tree_mode = request.GET.get('tree', '').lower() == 'true'
        if tree_mode:
            tree_data = PortfolioCategoryAdminService.get_tree_data()
            return APIResponse.success(
                message=CATEGORY_SUCCESS["category_list_success"],
                data={'data': tree_data},
                status_code=status.HTTP_200_OK
            )

        # Use the Django Filter backend properly
        queryset = self.filter_queryset(PortfolioCategoryAdminService.get_tree_queryset())
        
        # Apply DRF pagination
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = PortfolioCategoryAdminListSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = PortfolioCategoryAdminListSerializer(queryset, many=True)
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
        if not PermissionValidator.has_permission(request.user, 'portfolio.category.create'):
            return APIResponse.error(
                message=CATEGORY_ERRORS.get("category_not_authorized", "You don't have permission to create portfolio categories"),
                status_code=status.HTTP_403_FORBIDDEN
            )
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Create category using service
        category = PortfolioCategoryAdminService.create_category(
            serializer.validated_data,
            created_by=request.user
        )
        
        # Return detailed response
        detail_serializer = PortfolioCategoryAdminDetailSerializer(category)
        return APIResponse.success(
            message=CATEGORY_SUCCESS["category_created"],
            data=detail_serializer.data,
            status_code=status.HTTP_201_CREATED
        )
    
    def retrieve(self, request, *args, **kwargs):
        """Get category detail with tree information"""
        if not PermissionValidator.has_permission(request.user, 'portfolio.category.read'):
            return APIResponse.error(
                message=CATEGORY_ERRORS.get("category_not_authorized", "You don't have permission to view portfolio categories"),
                status_code=status.HTTP_403_FORBIDDEN
            )
        category = PortfolioCategoryAdminService.get_category_by_id(kwargs.get('pk'))
        
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
        if not PermissionValidator.has_permission(request.user, 'portfolio.category.update'):
            return APIResponse.error(
                message=CATEGORY_ERRORS.get("category_not_authorized", "You don't have permission to update portfolio categories"),
                status_code=status.HTTP_403_FORBIDDEN
            )
        partial = kwargs.pop('partial', False)
        category_id = kwargs.get('pk')
        
        serializer = self.get_serializer(data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        
        # Update category using service
        try:
            updated_category = PortfolioCategoryAdminService.update_category_by_id(
                category_id, 
                serializer.validated_data
            )
            
            # Return detailed response
            detail_serializer = PortfolioCategoryAdminDetailSerializer(updated_category)
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
        if not PermissionValidator.has_permission(request.user, 'portfolio.category.delete'):
            return APIResponse.error(
                message=CATEGORY_ERRORS.get("category_not_authorized", "You don't have permission to delete portfolio categories"),
                status_code=status.HTTP_403_FORBIDDEN
            )
        category_id = kwargs.get('pk')
        
        try:
            PortfolioCategoryAdminService.delete_category_by_id(category_id)
            return APIResponse.success(
                message=CATEGORY_SUCCESS["category_deleted"],
                status_code=status.HTTP_200_OK
            )
        except PortfolioCategory.DoesNotExist:
            return APIResponse.error(
                message=CATEGORY_ERRORS["category_not_found"],
                status_code=status.HTTP_404_NOT_FOUND
            )
        except ValidationError as e:
            error_msg = str(e)
            if "portfolios" in error_msg:
                count_match = re.search(r'\d+', error_msg)
                count = count_match.group() if count_match else "0"
                message = CATEGORY_ERRORS["category_has_portfolios"].format(count=count)
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
        tree_data = PortfolioCategoryAdminService.get_tree_data()
        
        return APIResponse.success(
            message=CATEGORY_SUCCESS["category_list_success"],
            data=tree_data,
            status_code=status.HTTP_200_OK
        )
    
    @action(detail=False, methods=['get'])
    def roots(self, request):
        """Get root categories only"""
        root_categories = PortfolioCategoryAdminService.get_root_categories()
        
        return APIResponse.success(
            message=CATEGORY_SUCCESS["category_list_success"],
            data=root_categories,
            status_code=status.HTTP_200_OK
        )
    
    @action(detail=True, methods=['get'])
    def children(self, request, pk=None):
        """Get direct children of a category"""
        category = PortfolioCategoryAdminService.get_category_by_id(pk)
        
        if not category:
            return APIResponse.error(
                message=CATEGORY_ERRORS["category_not_found"],
                status_code=status.HTTP_404_NOT_FOUND
            )
        
        children = category.get_children().filter(is_active=True)
        serializer = PortfolioCategoryAdminListSerializer(children, many=True)
        
        return APIResponse.success(
            message=CATEGORY_SUCCESS["category_list_success"],
            data=serializer.data,
            status_code=status.HTTP_200_OK
        )
    
    @action(detail=True, methods=['get'])
    def breadcrumbs(self, request, pk=None):
        """Get category breadcrumbs"""
        category = PortfolioCategoryAdminService.get_category_by_id(pk)
        
        if not category:
            return APIResponse.error(
                message=CATEGORY_ERRORS["category_not_found"],
                status_code=status.HTTP_404_NOT_FOUND
            )
        
        breadcrumbs = PortfolioCategoryAdminService.get_breadcrumbs(category)
        
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
            PortfolioCategoryAdminService.move_category(pk, target_id, position)
            return APIResponse.success(
                message=CATEGORY_SUCCESS["category_moved"],
                status_code=status.HTTP_200_OK
            )
        except PortfolioCategory.DoesNotExist:
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
        popular_categories = PortfolioCategoryAdminService.get_popular_categories(limit)
        
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
            deleted_count = PortfolioCategoryAdminService.bulk_delete_categories(category_ids)
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
        stats = PortfolioCategoryAdminService.get_category_statistics()
        
        return APIResponse.success(
            message=CATEGORY_SUCCESS["category_statistics_retrieved"],
            data=stats,
            status_code=status.HTTP_200_OK
        )