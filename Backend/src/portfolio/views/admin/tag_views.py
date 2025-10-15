from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

from src.portfolio.models.tag import PortfolioTag
from src.portfolio.serializers.admin.tag_serializer import (
    PortfolioTagAdminListSerializer,
    PortfolioTagAdminDetailSerializer,
    PortfolioTagAdminCreateSerializer,
    PortfolioTagAdminUpdateSerializer
)
from src.portfolio.services.admin.tag_services import PortfolioTagAdminService
from src.portfolio.filters.admin.tag_filters import PortfolioTagAdminFilter
from src.core.pagination import StandardLimitPagination
from src.user.authorization.admin_permission import ContentManagerAccess
from src.user.authorization.admin_permission import SimpleAdminPermission


class PortfolioTagAdminViewSet(viewsets.ModelViewSet):
    """
    Optimized Tag ViewSet for Admin Panel with bulk operations
    """
    permission_classes = [ContentManagerAccess]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = PortfolioTagAdminFilter
    search_fields = ['name', 'description']
    ordering_fields = ['created_at', 'updated_at', 'name']
    ordering = ['-created_at']
    pagination_class = StandardLimitPagination  # Add DRF pagination
    
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
        filters = {
            'is_active': self._parse_bool(request.query_params.get('is_active')),
        }
        filters = {k: v for k, v in filters.items() if v is not None}
        search = request.query_params.get('search')
        
        queryset = PortfolioTagAdminService.get_tag_queryset(filters=filters, search=search)
        
        # Apply DRF pagination
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = PortfolioTagAdminListSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = PortfolioTagAdminListSerializer(queryset, many=True)
        return Response(serializer.data)
    
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
    
    @method_decorator(csrf_exempt)
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
        return Response(detail_serializer.data, status=status.HTTP_201_CREATED)
    
    def retrieve(self, request, *args, **kwargs):
        """Get tag detail with usage statistics"""
        tag = PortfolioTagAdminService.get_tag_by_id(kwargs.get('pk'))
        
        if not tag:
            return Response(
                {"detail": "تگ یافت نشد."},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = self.get_serializer(tag)
        return Response(serializer.data)
    
    def update(self, request, *args, **kwargs):
        """Update tag with validation"""
        partial = kwargs.pop('partial', False)
        tag = PortfolioTagAdminService.get_tag_by_id(kwargs.get('pk'))
        
        if not tag:
            return Response(
                {"detail": "تگ یافت نشد."},
                status=status.HTTP_404_NOT_FOUND
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
        return Response(detail_serializer.data)
    
    def destroy(self, request, *args, **kwargs):
        """Delete tag with safety checks"""
        tag_id = kwargs.get('pk')
        result = PortfolioTagAdminService.delete_tag_by_id(tag_id)
        
        if result['success']:
            return Response(status=status.HTTP_204_NO_CONTENT)
        else:
            return Response(
                {"detail": result['error']},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get'])
    def popular(self, request):
        """Get most popular tags"""
        limit = int(request.GET.get('limit', 10))
        tags = PortfolioTagAdminService.get_popular_tags(limit)
        
        return Response(tags)
    
    @action(detail=False, methods=['post'])
    def bulk_delete(self, request):
        """Bulk delete multiple tags"""
        tag_ids = request.data.get('tag_ids', [])
        
        if not tag_ids:
            return Response(
                {"detail": "شناسه تگ‌ها مورد نیاز است."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        result = PortfolioTagAdminService.bulk_delete_tags(tag_ids)
        
        if result['success']:
            return Response({'deleted_count': result['deleted_count']})
        else:
            return Response(
                {"detail": result['error']},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'])
    def merge(self, request, pk=None):
        """Merge this tag into another tag"""
        source_tag_id = pk
        target_tag_id = request.data.get('target_tag_id')
        
        if not target_tag_id:
            return Response(
                {"detail": "شناسه تگ مقصد مورد نیاز است."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if source_tag_id == target_tag_id:
            return Response(
                {"detail": "نمی‌توانید تگ را با خودش ادغام کنید."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            target_tag = PortfolioTagAdminService.merge_tags(source_tag_id, target_tag_id)
            detail_serializer = PortfolioTagAdminDetailSerializer(target_tag)
            
            return Response(detail_serializer.data)
        except Exception as e:
            return Response(
                {"detail": f"خطا در ادغام تگ‌ها: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
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
        
        return Response(stats)