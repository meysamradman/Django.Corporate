from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from django_filters.rest_framework import DjangoFilterBackend
from django.core.exceptions import ValidationError

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
from src.user.access_control import portfolio_permission, PermissionRequiredMixin
from src.core.responses.response import APIResponse
from src.core.utils.validation_helpers import extract_validation_message
from src.portfolio.messages.messages import TAG_SUCCESS, TAG_ERRORS

class PortfolioTagAdminViewSet(PermissionRequiredMixin, viewsets.ModelViewSet):
    permission_classes = [portfolio_permission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = PortfolioTagAdminFilter
    search_fields = ['name', 'description']
    ordering_fields = ['created_at', 'updated_at', 'name']
    ordering = ['-created_at']
    pagination_class = StandardLimitPagination
    
    permission_map = {
        'list': 'portfolio.tag.read',
        'retrieve': 'portfolio.tag.read',
        'create': 'portfolio.tag.create',
        'update': 'portfolio.tag.update',
        'partial_update': 'portfolio.tag.update',
        'destroy': 'portfolio.tag.delete',
        'popular': 'portfolio.tag.read',
    }
    permission_denied_message = TAG_ERRORS["tag_not_authorized"]
    
    def get_queryset(self):
        if self.action == 'list':
            return PortfolioTag.objects.with_counts()
        elif self.action in ['retrieve', 'update', 'partial_update']:
            return PortfolioTag.objects.with_counts()
        else:
            return PortfolioTag.objects.all()

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        
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
        if self.action == 'list':
            return PortfolioTagAdminListSerializer
        elif self.action == 'create':
            return PortfolioTagAdminCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return PortfolioTagAdminUpdateSerializer
        else:
            return PortfolioTagAdminDetailSerializer
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        tag = PortfolioTagAdminService.create_tag(
            serializer.validated_data,
            created_by=request.user
        )
        
        detail_serializer = PortfolioTagAdminDetailSerializer(tag)
        return APIResponse.success(
            message=TAG_SUCCESS["tag_created"],
            data=detail_serializer.data,
            status_code=status.HTTP_201_CREATED
        )
    
    def retrieve(self, request, *args, **kwargs):
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
        partial = kwargs.pop('partial', False)
        tag = PortfolioTagAdminService.get_tag_by_id(kwargs.get('pk'))
        
        if not tag:
            return APIResponse.error(
                message=TAG_ERRORS["tag_not_found"],
                status_code=status.HTTP_404_NOT_FOUND
            )
        
        serializer = self.get_serializer(tag, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        
        updated_tag = PortfolioTagAdminService.update_tag_by_id(
            tag.id, 
            serializer.validated_data
        )
        
        detail_serializer = PortfolioTagAdminDetailSerializer(updated_tag)
        return APIResponse.success(
            message=TAG_SUCCESS["tag_updated"],
            data=detail_serializer.data,
            status_code=status.HTTP_200_OK
        )
    
    def destroy(self, request, *args, **kwargs):
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
            return APIResponse.error(
                message=extract_validation_message(e, TAG_ERRORS["tag_delete_failed"]),
                status_code=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get'])
    def popular(self, request):
        limit = int(request.GET.get('limit', 10))
        tags = PortfolioTagAdminService.get_popular_tags(limit)
        
        return APIResponse.success(
            message=TAG_SUCCESS["tag_list_success"],
            data=tags,
            status_code=status.HTTP_200_OK
        )
    
    @action(detail=False, methods=['post'], url_path='bulk-delete')
    def bulk_delete(self, request):
        tag_ids = request.data.get('ids', [])
        
        if not tag_ids:
            return APIResponse.error(
                message=TAG_ERRORS["tag_ids_required"],
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
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
            return APIResponse.error(
                message=extract_validation_message(e, TAG_ERRORS["tag_delete_failed"]),
                status_code=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'])
    def merge(self, request, pk=None):
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