import re
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from django_filters.rest_framework import DjangoFilterBackend
from django.core.exceptions import ValidationError

from src.core.responses.response import APIResponse
from src.core.pagination import StandardLimitPagination
from src.user.access_control import real_estate_permission, PermissionValidator

from src.real_estate.models.tag import PropertyTag
from src.real_estate.serializers.admin.tag_serializer import (
    PropertyTagAdminListSerializer,
    PropertyTagAdminDetailSerializer,
    PropertyTagAdminCreateSerializer,
    PropertyTagAdminUpdateSerializer,
)
from src.real_estate.services.admin.tag_services import PropertyTagAdminService
from src.real_estate.messages.messages import TAG_SUCCESS, TAG_ERRORS


class PropertyTagAdminViewSet(viewsets.ModelViewSet):
    permission_classes = [real_estate_permission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description']
    ordering_fields = ['created_at', 'updated_at', 'title']
    ordering = ['-created_at']
    pagination_class = StandardLimitPagination
    
    def get_queryset(self):
        if self.action == 'list':
            return PropertyTagAdminService.get_tag_queryset()
        elif self.action in ['retrieve', 'update', 'partial_update']:
            return PropertyTagAdminService.get_tag_queryset()
        else:
            return PropertyTag.objects.all()
    
    def get_serializer_class(self):
        if self.action == 'list':
            return PropertyTagAdminListSerializer
        elif self.action == 'create':
            return PropertyTagAdminCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return PropertyTagAdminUpdateSerializer
        else:
            return PropertyTagAdminDetailSerializer
    
    def list(self, request, *args, **kwargs):
        if not PermissionValidator.has_permission(request.user, 'real_estate.tag.read'):
            return APIResponse.error(
                message=TAG_ERRORS["tag_not_authorized"],
                status_code=status.HTTP_403_FORBIDDEN
            )
        
        filters = {
            'is_active': self._parse_bool(request.query_params.get('is_active')),
            'is_public': self._parse_bool(request.query_params.get('is_public')),
        }
        filters = {k: v for k, v in filters.items() if v is not None}
        search = request.query_params.get('search')
        
        queryset = PropertyTagAdminService.get_tag_queryset(filters=filters, search=search)
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
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
    
    def create(self, request, *args, **kwargs):
        if not PermissionValidator.has_permission(request.user, 'real_estate.tag.create'):
            return APIResponse.error(
                message=TAG_ERRORS["tag_not_authorized"],
                status_code=status.HTTP_403_FORBIDDEN
            )
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        tag = PropertyTagAdminService.create_tag(
            serializer.validated_data,
            created_by=request.user
        )
        
        detail_serializer = PropertyTagAdminDetailSerializer(tag)
        return APIResponse.success(
            message=TAG_SUCCESS["tag_created"],
            data=detail_serializer.data,
            status_code=status.HTTP_201_CREATED
        )
    
    def retrieve(self, request, *args, **kwargs):
        if not PermissionValidator.has_permission(request.user, 'real_estate.tag.read'):
            return APIResponse.error(
                message=TAG_ERRORS["tag_not_authorized"],
                status_code=status.HTTP_403_FORBIDDEN
            )
        
        tag = PropertyTagAdminService.get_tag_by_id(kwargs.get('pk'))
        
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
        if not PermissionValidator.has_permission(request.user, 'real_estate.tag.update'):
            return APIResponse.error(
                message=TAG_ERRORS["tag_not_authorized"],
                status_code=status.HTTP_403_FORBIDDEN
            )
        
        partial = kwargs.pop('partial', False)
        tag_id = kwargs.get('pk')
        
        serializer = self.get_serializer(data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        
        try:
            updated_tag = PropertyTagAdminService.update_tag_by_id(
                tag_id,
                serializer.validated_data
            )
            
            detail_serializer = PropertyTagAdminDetailSerializer(updated_tag)
            return APIResponse.success(
                message=TAG_SUCCESS["tag_updated"],
                data=detail_serializer.data,
                status_code=status.HTTP_200_OK
            )
        except PropertyTag.DoesNotExist:
            return APIResponse.error(
                message=TAG_ERRORS["tag_not_found"],
                status_code=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return APIResponse.error(
                message=TAG_ERRORS["tag_update_failed"],
                status_code=status.HTTP_400_BAD_REQUEST
            )
    
    def destroy(self, request, *args, **kwargs):
        if not PermissionValidator.has_permission(request.user, 'real_estate.tag.delete'):
            return APIResponse.error(
                message=TAG_ERRORS["tag_not_authorized"],
                status_code=status.HTTP_403_FORBIDDEN
            )
        
        tag_id = kwargs.get('pk')
        
        try:
            PropertyTagAdminService.delete_tag_by_id(tag_id)
            return APIResponse.success(
                message=TAG_SUCCESS["tag_deleted"],
                status_code=status.HTTP_200_OK
            )
        except PropertyTag.DoesNotExist:
            return APIResponse.error(
                message=TAG_ERRORS["tag_not_found"],
                status_code=status.HTTP_404_NOT_FOUND
            )
        except ValidationError as e:
            error_msg = str(e)
            if "properties" in error_msg:
                count_match = re.search(r'\d+', error_msg)
                count = count_match.group() if count_match else "0"
                message = TAG_ERRORS["tag_has_properties"].format(count=count)
            else:
                message = TAG_ERRORS["tag_delete_failed"]
            return APIResponse.error(
                message=message,
                status_code=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['post'], url_path='bulk-delete')
    def bulk_delete(self, request):
        tag_ids = request.data.get('ids', [])
        
        if not tag_ids:
            return APIResponse.error(
                message=TAG_ERRORS.get("tag_not_found", "Tag IDs required"),
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        if not isinstance(tag_ids, list):
            tag_ids = [tag_ids]
        
        try:
            deleted_count = PropertyTagAdminService.bulk_delete_tags(tag_ids)
            return APIResponse.success(
                message=TAG_SUCCESS.get("tag_deleted", "Tags deleted successfully"),
                data={'deleted_count': deleted_count},
                status_code=status.HTTP_200_OK
            )
        except ValidationError as e:
            error_msg = str(e)
            if "properties" in error_msg:
                count_match = re.search(r'\d+', error_msg)
                count = count_match.group() if count_match else "0"
                message = TAG_ERRORS["tag_has_properties"].format(count=count)
            else:
                message = TAG_ERRORS["tag_delete_failed"]
            return APIResponse.error(
                message=message,
                status_code=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get'])
    def popular(self, request):
        limit = int(request.GET.get('limit', 10))
        tags = PropertyTagAdminService.get_popular_tags(limit)
        
        return APIResponse.success(
            message=TAG_SUCCESS["tag_list_success"],
            data=tags,
            status_code=status.HTTP_200_OK
        )

