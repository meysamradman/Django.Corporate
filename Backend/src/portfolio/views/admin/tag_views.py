from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q

from src.portfolio.models.tag import PortfolioTag
from src.portfolio.serializers.admin.tag_serializer import (
    PortfolioTagAdminListSerializer,
    PortfolioTagAdminDetailSerializer,
    PortfolioTagAdminCreateSerializer,
    PortfolioTagAdminUpdateSerializer
)
from src.portfolio.services.admin.tag_services import PortfolioTagAdminService
from src.portfolio.filters.admin.tag_filters import PortfolioTagAdminFilter
from src.core.responses import APIResponse
from src.user.authorization.admin_permission import RequireAdminRole


class PortfolioTagAdminViewSet(viewsets.ModelViewSet):
    """
    Optimized Tag ViewSet for Admin Panel with bulk operations
    """
    permission_classes = [RequireAdminRole('super_admin', 'content_manager')]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = PortfolioTagAdminFilter
    search_fields = ['name', 'description']
    ordering_fields = ['created_at', 'updated_at', 'name']
    ordering = ['-created_at']
    # Service-level/custom pagination is used; DRF pagination disabled
    
    def get_queryset(self):
        """Optimized queryset based on action"""
        if self.action == 'list':
            return PortfolioTag.objects.with_counts().order_by('-portfolio_count', 'name')
        elif self.action in ['retrieve', 'update', 'partial_update']:
            return PortfolioTag.objects.with_counts()
        else:
            return PortfolioTag.objects.all()

    def list(self, request, *args, **kwargs):
        """List tags with custom pagination (service-level style)"""
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 20))
        
        filters = {
            'is_active': self._parse_bool(request.query_params.get('is_active')),
        }
        filters = {k: v for k, v in filters.items() if v is not None}
        search = request.query_params.get('search')
        
        queryset = PortfolioTagAdminService.get_tag_queryset(filters=filters, search=search)
        from django.core.paginator import Paginator
        paginator = Paginator(queryset, page_size)
        page_obj = paginator.get_page(page)

        serializer = PortfolioTagAdminListSerializer(page_obj.object_list, many=True)
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

        return APIResponse.success(
            data=data,
            message="فهرست تگ‌ها با موفقیت دریافت شد."
        )
    
    @staticmethod
    def _parse_bool(value):
        if value is None:
            return None
        if isinstance(value, bool):
            return value
        return value.lower() in ('1', 'true', 'yes', 'on')
    
    def get_serializer_class(self):
        """Dynamic serializer selection"""
        if self.action == 'list':
            return PortfolioTagAdminListSerializer
        elif self.action == 'create':
            return PortfolioTagAdminCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return PortfolioTagAdminUpdateSerializer
        else:
            return PortfolioTagAdminDetailSerializer
    
    def create(self, request, *args, **kwargs):
        """Create tag with auto-slug generation"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Create tag using service
        tag = PortfolioTagAdminService.create_tag(
            serializer.validated_data,
            created_by=request.user
        )
        
        # Return detailed response
        detail_serializer = PortfolioTagAdminDetailSerializer(tag)
        return APIResponse.success(
            data=detail_serializer.data,
            message="تگ با موفقیت ایجاد شد.",
            status_code=status.HTTP_201_CREATED
        )
    
    def retrieve(self, request, *args, **kwargs):
        """Get tag detail with usage statistics"""
        tag = PortfolioTagAdminService.get_tag_by_id(kwargs.get('pk'))
        
        if not tag:
            return APIResponse.error(
                message="تگ یافت نشد.",
                status_code=status.HTTP_404_NOT_FOUND
            )
        
        serializer = self.get_serializer(tag)
        return APIResponse.success(
            data=serializer.data,
            message="تگ با موفقیت دریافت شد."
        )
    
    def update(self, request, *args, **kwargs):
        """Update tag with validation"""
        partial = kwargs.pop('partial', False)
        tag = PortfolioTagAdminService.get_tag_by_id(kwargs.get('pk'))
        
        if not tag:
            return APIResponse.error(
                message="تگ یافت نشد.",
                status_code=status.HTTP_404_NOT_FOUND
            )
        
        serializer = self.get_serializer(tag, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        
        # Update tag using service
        updated_tag = PortfolioTagAdminService.update_tag_by_id(
            tag.id, 
            serializer.validated_data
        )
        
        # Return detailed response
        detail_serializer = PortfolioTagAdminDetailSerializer(updated_tag)
        return APIResponse.success(
            data=detail_serializer.data,
            message="تگ با موفقیت به‌روزرسانی شد."
        )
    
    def destroy(self, request, *args, **kwargs):
        """Delete tag with safety checks"""
        tag_id = kwargs.get('pk')
        result = PortfolioTagAdminService.delete_tag_by_id(tag_id)
        
        if result['success']:
            return APIResponse.success(
                message="تگ با موفقیت حذف شد.",
                status_code=status.HTTP_204_NO_CONTENT
            )
        else:
            return APIResponse.error(
                message=result['error'],
                status_code=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get'])
    def popular(self, request):
        """Get most popular tags"""
        limit = int(request.GET.get('limit', 10))
        tags = PortfolioTagAdminService.get_popular_tags(limit)
        
        return APIResponse.success(
            data=tags,
            message="تگ‌های محبوب با موفقیت دریافت شدند."
        )
    
    @action(detail=False, methods=['post'])
    def bulk_delete(self, request):
        """Bulk delete multiple tags"""
        tag_ids = request.data.get('tag_ids', [])
        
        if not tag_ids:
            return APIResponse.error(
                message="شناسه تگ‌ها مورد نیاز است.",
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        result = PortfolioTagAdminService.bulk_delete_tags(tag_ids)
        
        if result['success']:
            return APIResponse.success(
                data={'deleted_count': result['deleted_count']},
                message=f"{result['deleted_count']} تگ با موفقیت حذف شدند."
            )
        else:
            return APIResponse.error(
                message=result['error'],
                status_code=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'])
    def merge(self, request, pk=None):
        """Merge this tag into another tag"""
        source_tag_id = pk
        target_tag_id = request.data.get('target_tag_id')
        
        if not target_tag_id:
            return APIResponse.error(
                message="شناسه تگ مقصد مورد نیاز است.",
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        if source_tag_id == target_tag_id:
            return APIResponse.error(
                message="نمی‌توانید تگ را با خودش ادغام کنید.",
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            target_tag = PortfolioTagAdminService.merge_tags(source_tag_id, target_tag_id)
            detail_serializer = PortfolioTagAdminDetailSerializer(target_tag)
            
            return APIResponse.success(
                data=detail_serializer.data,
                message="تگ‌ها با موفقیت ادغام شدند."
            )
        except Exception as e:
            return APIResponse.error(
                message=f"خطا در ادغام تگ‌ها: {str(e)}",
                status_code=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get tag statistics for admin dashboard"""
        total_tags = PortfolioTag.objects.count()
        active_tags = PortfolioTag.objects.filter(is_active=True).count()
        used_tags = PortfolioTag.objects.filter(portfolio_tags__isnull=False).distinct().count()
        unused_tags = total_tags - used_tags
        
        stats = {
            'total_tags': total_tags,
            'active_tags': active_tags,
            'used_tags': used_tags,
            'unused_tags': unused_tags,
            'popular_tags': PortfolioTagAdminService.get_popular_tags(5)
        }
        
        return APIResponse.success(
            data=stats,
            message="آمار تگ‌ها با موفقیت دریافت شد."
        )