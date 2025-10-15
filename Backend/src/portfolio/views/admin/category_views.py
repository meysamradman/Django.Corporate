from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q

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
from src.user.authorization.admin_permission import ContentManagerAccess


class PortfolioCategoryAdminViewSet(viewsets.ModelViewSet):
    """
    Optimized Category ViewSet for Admin Panel with tree operations
    """
    permission_classes = [ContentManagerAccess]
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
        tree_mode = request.GET.get('tree', '').lower() == 'true'
        if tree_mode:
            tree_data = PortfolioCategoryAdminService.get_tree_data()
            return Response({'data': tree_data})

        filters = {
            'is_active': self._parse_bool(request.query_params.get('is_active')),
            'is_public': self._parse_bool(request.query_params.get('is_public')),
        }
        filters = {k: v for k, v in filters.items() if v is not None}
        search = request.query_params.get('search')
        
        queryset = PortfolioCategoryAdminService.get_tree_queryset()
        if filters:
            if filters.get('is_active') is not None:
                queryset = queryset.filter(is_active=filters['is_active'])
            if filters.get('is_public') is not None:
                queryset = queryset.filter(is_public=filters['is_public'])
        
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | Q(description__icontains=search)
            )
        
        # Apply DRF pagination
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = PortfolioCategoryAdminListSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = PortfolioCategoryAdminListSerializer(queryset, many=True)
        return Response(serializer.data)
    
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
        category = PortfolioCategoryAdminService.create_category(
            serializer.validated_data,
            created_by=request.user
        )
        
        # Return detailed response
        detail_serializer = PortfolioCategoryAdminDetailSerializer(category)
        return Response(detail_serializer.data, status=status.HTTP_201_CREATED)
    
    def retrieve(self, request, *args, **kwargs):
        """Get category detail with tree information"""
        category = PortfolioCategoryAdminService.get_category_by_id(kwargs.get('pk'))
        
        if not category:
            return Response(
                {"detail": "دسته‌بندی یافت نشد."},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = self.get_serializer(category)
        return Response(serializer.data)

    def update(self, request, *args, **kwargs):
        """Update category with tree operations"""
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
            return Response(detail_serializer.data)
        except Exception as e:
            return Response(
                {"detail": f"خطا در به‌روزرسانی: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )

    def destroy(self, request, *args, **kwargs):
        """Delete category with safety checks"""
        category_id = kwargs.get('pk')
        result = PortfolioCategoryAdminService.delete_category_by_id(category_id)
        
        if result['success']:
            return Response(status=status.HTTP_204_NO_CONTENT)
        else:
            return Response(
                {"detail": result['error']},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get'])
    def tree(self, request):
        """Get complete category tree"""
        tree_data = PortfolioCategoryAdminService.get_tree_data()
        
        return Response(tree_data)
    
    @action(detail=False, methods=['get'])
    def roots(self, request):
        """Get root categories only"""
        root_categories = PortfolioCategoryAdminService.get_root_categories()
        
        return Response(root_categories)
    
    @action(detail=True, methods=['get'])
    def children(self, request, pk=None):
        """Get direct children of a category"""
        category = PortfolioCategoryAdminService.get_category_by_id(pk)
        
        if not category:
            return Response(
                {"detail": "دسته‌بندی یافت نشد."},
                status=status.HTTP_404_NOT_FOUND
            )
        
        children = category.get_children().filter(is_active=True)
        serializer = PortfolioCategoryAdminListSerializer(children, many=True)
        
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def breadcrumbs(self, request, pk=None):
        """Get category breadcrumbs"""
        category = PortfolioCategoryAdminService.get_category_by_id(pk)
        
        if not category:
            return Response(
                {"detail": "دسته‌بندی یافت نشد."},
                status=status.HTTP_404_NOT_FOUND
            )
        
        breadcrumbs = PortfolioCategoryAdminService.get_breadcrumbs(category)
        
        return Response(breadcrumbs)
    
    @action(detail=True, methods=['post'])
    def move(self, request, pk=None):
        """Move category to new position"""
        target_id = request.data.get('target_id')
        position = request.data.get('position', 'last-child')
        
        if not target_id:
            return Response(
                {"detail": "شناسه دسته‌بندی مقصد مورد نیاز است."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        result = PortfolioCategoryAdminService.move_category(pk, target_id, position)
        
        if result['success']:
            return Response({"detail": "دسته‌بندی با موفقیت منتقل شد."})
        else:
            return Response(
                {"detail": result['error']},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get'])
    def popular(self, request):
        """Get most popular categories"""
        limit = int(request.GET.get('limit', 10))
        popular_categories = PortfolioCategoryAdminService.get_popular_categories(limit)
        
        return Response(popular_categories)
    
    @action(detail=False, methods=['post'])
    def bulk_delete(self, request):
        """Bulk delete multiple categories"""
        category_ids = request.data.get('category_ids', [])
        
        if not category_ids:
            return Response(
                {"detail": "شناسه دسته‌بندی‌ها مورد نیاز است."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        result = PortfolioCategoryAdminService.bulk_delete_categories(category_ids)
        
        if result['success']:
            return Response({'deleted_count': result['deleted_count']})
        else:
            return Response(
                {"detail": result['error']},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get category statistics for admin dashboard"""
        stats = PortfolioCategoryAdminService.get_category_statistics()
        
        return Response(stats)