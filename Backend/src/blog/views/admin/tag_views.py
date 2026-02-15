from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from django_filters.rest_framework import DjangoFilterBackend
from django.core.exceptions import ValidationError

from src.blog.models.tag import BlogTag
from src.blog.serializers.admin.tag_serializer import (
    BlogTagAdminListSerializer,
    BlogTagAdminDetailSerializer,
    BlogTagAdminCreateSerializer,
    BlogTagAdminUpdateSerializer
)
from src.blog.services.admin.tag_services import BlogTagAdminService
from src.blog.filters.admin.tag_filters import BlogTagAdminFilter
from src.core.pagination import StandardLimitPagination
from src.user.access_control import blog_permission, PermissionRequiredMixin
from src.core.responses.response import APIResponse
from src.core.utils.validation_helpers import extract_validation_message, normalize_validation_error
from src.blog.messages.messages import TAG_SUCCESS, TAG_ERRORS

class BlogTagAdminViewSet(PermissionRequiredMixin, viewsets.ModelViewSet):
    permission_classes = [blog_permission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = BlogTagAdminFilter
    search_fields = ['name', 'description']
    ordering_fields = ['created_at', 'updated_at', 'name']
    ordering = ['-created_at']
    pagination_class = StandardLimitPagination
    
    permission_map = {
        'list': 'blog.tag.read',
        'retrieve': 'blog.tag.read',
        'create': 'blog.tag.create',
        'update': 'blog.tag.update',
        'partial_update': 'blog.tag.update',
        'destroy': 'blog.tag.delete',
        'popular': 'blog.tag.read',
    }
    permission_denied_message = TAG_ERRORS["tag_not_authorized"]
    
    def get_queryset(self):
        if self.action == 'list':
            return BlogTag.objects.with_counts()
        elif self.action in ['retrieve', 'update', 'partial_update']:
            return BlogTag.objects.with_counts()
        else:
            return BlogTag.objects.all()

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = BlogTagAdminListSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = BlogTagAdminListSerializer(queryset, many=True)
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
            return BlogTagAdminListSerializer
        elif self.action == 'create':
            return BlogTagAdminCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return BlogTagAdminUpdateSerializer
        else:
            return BlogTagAdminDetailSerializer
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            tag = BlogTagAdminService.create_tag(
                serializer.validated_data,
                created_by=request.user
            )

            detail_serializer = BlogTagAdminDetailSerializer(tag)
            return APIResponse.success(
                message=TAG_SUCCESS["tag_created"],
                data=detail_serializer.data,
                status_code=status.HTTP_201_CREATED
            )
        except ValidationError as e:
            return APIResponse.error(
                message=extract_validation_message(e, TAG_ERRORS["tag_create_failed"]),
                errors=normalize_validation_error(e),
                status_code=status.HTTP_400_BAD_REQUEST
            )
    
    def retrieve(self, request, *args, **kwargs):
        tag = BlogTagAdminService.get_tag_by_id(kwargs.get('pk'))
        
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
        tag = BlogTagAdminService.get_tag_by_id(kwargs.get('pk'))
        
        if not tag:
            return APIResponse.error(
                message=TAG_ERRORS["tag_not_found"],
                status_code=status.HTTP_404_NOT_FOUND
            )
        
        serializer = self.get_serializer(tag, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        
        try:
            updated_tag = BlogTagAdminService.update_tag_by_id(
                tag.id,
                serializer.validated_data
            )

            detail_serializer = BlogTagAdminDetailSerializer(updated_tag)
            return APIResponse.success(
                message=TAG_SUCCESS["tag_updated"],
                data=detail_serializer.data,
                status_code=status.HTTP_200_OK
            )
        except ValidationError as e:
            return APIResponse.error(
                message=extract_validation_message(e, TAG_ERRORS["tag_update_failed"]),
                errors=normalize_validation_error(e),
                status_code=status.HTTP_400_BAD_REQUEST
            )
    
    def destroy(self, request, *args, **kwargs):
        tag_id = kwargs.get('pk')
        
        try:
            BlogTagAdminService.delete_tag_by_id(tag_id)
            return APIResponse.success(
                message=TAG_SUCCESS["tag_deleted"],
                status_code=status.HTTP_200_OK
            )
        except BlogTag.DoesNotExist:
            return APIResponse.error(
                message=TAG_ERRORS["tag_not_found"],
                status_code=status.HTTP_404_NOT_FOUND
            )
        except ValidationError as e:
            return APIResponse.error(
                message=extract_validation_message(e, TAG_ERRORS["tag_delete_failed"]),
                errors=normalize_validation_error(e),
                status_code=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get'])
    def popular(self, request):
        limit = int(request.GET.get('limit', 10))
        tags = BlogTagAdminService.get_popular_tags(limit)
        
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
            deleted_count = BlogTagAdminService.bulk_delete_tags(tag_ids)
            return APIResponse.success(
                message=TAG_SUCCESS["tag_bulk_deleted"],
                data={'deleted_count': deleted_count},
                status_code=status.HTTP_200_OK
            )
        except ValidationError as e:
            return APIResponse.error(
                message=extract_validation_message(e, TAG_ERRORS["tag_delete_failed"]),
                errors=normalize_validation_error(e),
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
            target_tag = BlogTagAdminService.merge_tags(source_tag_id, target_tag_id)
            detail_serializer = BlogTagAdminDetailSerializer(target_tag)
            
            return APIResponse.success(
                message=TAG_SUCCESS["tag_merged"],
                data=detail_serializer.data,
                status_code=status.HTTP_200_OK
            )
        except BlogTag.DoesNotExist:
            return APIResponse.error(
                message=TAG_ERRORS["tag_not_found"],
                status_code=status.HTTP_404_NOT_FOUND
            )
        except ValidationError as e:
            return APIResponse.error(
                message=extract_validation_message(e, TAG_ERRORS["tag_update_failed"]),
                errors=normalize_validation_error(e),
                status_code=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        total_tags = BlogTag.objects.count()
        active_tags = BlogTag.objects.filter(is_active=True).count()
        used_tags = BlogTag.objects.filter(blog_tags__isnull=False).distinct().count()
        unused_tags = total_tags - used_tags
        
        stats = {
            'total_tags': total_tags,
            'active_tags': active_tags,
            'used_tags': used_tags,
            'unused_tags': unused_tags,
            'popular_tags': BlogTagAdminService.get_popular_tags(5)
        }
        
        return APIResponse.success(
            message=TAG_SUCCESS["tag_statistics_retrieved"],
            data=stats,
            status_code=status.HTTP_200_OK
        )