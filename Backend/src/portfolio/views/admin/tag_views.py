import re
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from django_filters.rest_framework import DjangoFilterBackend
from django.core.exceptions import ValidationError
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
from src.user.authorization.admin_permission import PortfolioManagerAccess
from src.user.authorization.admin_permission import SimpleAdminPermission
from src.core.responses.response import APIResponse
from src.portfolio.messages.messages import TAG_SUCCESS, TAG_ERRORS
from src.user.permissions import PermissionValidator


class PortfolioTagAdminViewSet(viewsets.ModelViewSet):
    """
    Optimized Tag ViewSet for Admin Panel with bulk operations
    """
    permission_classes = [PortfolioManagerAccess]
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
        if not PermissionValidator.has_permission(request.user, 'portfolio.tag.read'):
            return APIResponse.error(
                message=TAG_ERRORS.get("tag_not_authorized", "You don't have permission to view portfolio tags"),
                status_code=status.HTTP_403_FORBIDDEN
            )
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
        return APIResponse.success(
            message=TAG_SUCCESS["tag_list_success"],
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
        if not PermissionValidator.has_permission(request.user, 'portfolio.tag.create'):
            return APIResponse.error(
                message=TAG_ERRORS.get("tag_not_authorized", "You don't have permission to create portfolio tags"),
                status_code=status.HTTP_403_FORBIDDEN
            )
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
            message=TAG_SUCCESS["tag_created"],
            data=detail_serializer.data,
            status_code=status.HTTP_201_CREATED
        )
    
    def retrieve(self, request, *args, **kwargs):
        """Get tag detail with usage statistics"""
        if not PermissionValidator.has_permission(request.user, 'portfolio.tag.read'):
            return APIResponse.error(
                message=TAG_ERRORS.get("tag_not_authorized", "You don't have permission to view portfolio tags"),
                status_code=status.HTTP_403_FORBIDDEN
            )
        tag = PortfolioTagAdminService.get_tag_by_id(kwargs.get('pk'))
        
        if not tag:
            return APIResponse.error(
                message=TAG_ERRORS["tag_not_found"],
                status_code=status.HTTP_404_NOT_FOUND
            )
        
        serializer = self.get_serializer(tag)
        return APIResponse.success(
            message=TAG_SUCCESS["tag_retrieved"],
            data=serializer.data,
            status_code=status.HTTP_200_OK
        )
    
    def update(self, request, *args, **kwargs):
        """Update tag with validation"""
        if not PermissionValidator.has_permission(request.user, 'portfolio.tag.update'):
            return APIResponse.error(
                message=TAG_ERRORS.get("tag_not_authorized", "You don't have permission to update portfolio tags"),
                status_code=status.HTTP_403_FORBIDDEN
            )
        partial = kwargs.pop('partial', False)
        tag = PortfolioTagAdminService.get_tag_by_id(kwargs.get('pk'))
        
        if not tag:
            return APIResponse.error(
                message=TAG_ERRORS["tag_not_found"],
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
            message=TAG_SUCCESS["tag_updated"],
            data=detail_serializer.data,
            status_code=status.HTTP_200_OK
        )
    
    def destroy(self, request, *args, **kwargs):
        """Delete tag with safety checks"""
        if not PermissionValidator.has_permission(request.user, 'portfolio.tag.delete'):
            return APIResponse.error(
                message=TAG_ERRORS.get("tag_not_authorized", "You don't have permission to delete portfolio tags"),
                status_code=status.HTTP_403_FORBIDDEN
            )
        tag_id = kwargs.get('pk')
        
        try:
            PortfolioTagAdminService.delete_tag_by_id(tag_id)
            return APIResponse.success(
                message=TAG_SUCCESS["tag_deleted"],
                status_code=status.HTTP_200_OK
            )
        except PortfolioTag.DoesNotExist:
            return APIResponse.error(
                message=TAG_ERRORS["tag_not_found"],
                status_code=status.HTTP_404_NOT_FOUND
            )
        except ValidationError as e:
            error_msg = str(e)
            if "portfolios" in error_msg:
                count_match = re.search(r'\d+', error_msg)
                count = count_match.group() if count_match else "0"
                message = TAG_ERRORS["tag_has_portfolios"].format(count=count)
            else:
                message = TAG_ERRORS["tag_delete_failed"]
            return APIResponse.error(
                message=message,
                status_code=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get'])
    def popular(self, request):
        """Get most popular tags"""
        limit = int(request.GET.get('limit', 10))
        tags = PortfolioTagAdminService.get_popular_tags(limit)
        
        return APIResponse.success(
            message=TAG_SUCCESS["tag_list_success"],
            data=tags,
            status_code=status.HTTP_200_OK
        )
    
    @action(detail=False, methods=['post'], url_path='bulk-delete')
    def bulk_delete(self, request):
        """Bulk delete multiple tags"""
        tag_ids = request.data.get('ids', [])
        
        if not tag_ids:
            return APIResponse.error(
                message=TAG_ERRORS["tag_ids_required"],
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        # Convert to list if it's a single value
        if not isinstance(tag_ids, list):
            tag_ids = [tag_ids]
        
        try:
            deleted_count = PortfolioTagAdminService.bulk_delete_tags(tag_ids)
            return APIResponse.success(
                message=TAG_SUCCESS["tag_bulk_deleted"],
                data={'deleted_count': deleted_count},
                status_code=status.HTTP_200_OK
            )
        except ValidationError as e:
            error_msg = str(e)
            if "not found" in error_msg.lower():
                message = TAG_ERRORS["tags_not_found"]
            else:
                message = TAG_ERRORS["tag_delete_failed"]
            return APIResponse.error(
                message=message,
                status_code=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'])
    def merge(self, request, pk=None):
        """Merge this tag into another tag"""
        source_tag_id = pk
        target_tag_id = request.data.get('target_tag_id')
        
        if not target_tag_id:
            return APIResponse.error(
                message=TAG_ERRORS["target_tag_id_required"],
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        if source_tag_id == target_tag_id:
            return APIResponse.error(
                message=TAG_ERRORS["tag_cannot_merge_with_self"],
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            target_tag = PortfolioTagAdminService.merge_tags(source_tag_id, target_tag_id)
            detail_serializer = PortfolioTagAdminDetailSerializer(target_tag)
            
            return APIResponse.success(
                message=TAG_SUCCESS["tag_merged"],
                data=detail_serializer.data,
                status_code=status.HTTP_200_OK
            )
        except PortfolioTag.DoesNotExist:
            return APIResponse.error(
                message=TAG_ERRORS["tag_not_found"],
                status_code=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return APIResponse.error(
                message=TAG_ERRORS["tag_update_failed"],
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
            message=TAG_SUCCESS["tag_statistics_retrieved"],
            data=stats,
            status_code=status.HTTP_200_OK
        )