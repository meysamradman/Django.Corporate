import re
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from django_filters.rest_framework import DjangoFilterBackend
from django.core.exceptions import ValidationError

from src.core.responses.response import APIResponse
from src.core.pagination import StandardLimitPagination
from src.user.access_control import real_estate_permission, PermissionRequiredMixin

from src.real_estate.models.type import PropertyType
from src.real_estate.serializers.admin.type_serializer import (
    PropertyTypeAdminListSerializer,
    PropertyTypeAdminDetailSerializer,
    PropertyTypeAdminCreateSerializer,
    PropertyTypeAdminUpdateSerializer,
)
from src.real_estate.services.admin.type_services import PropertyTypeAdminService
from src.real_estate.messages.messages import TYPE_SUCCESS, TYPE_ERRORS


class PropertyTypeAdminViewSet(PermissionRequiredMixin, viewsets.ModelViewSet):
    permission_classes = [real_estate_permission]
    
    permission_map = {
        'list': 'real_estate.type.read',
        'retrieve': 'real_estate.type.read',
        'create': 'real_estate.type.create',
        'update': 'real_estate.type.update',
        'partial_update': 'real_estate.type.update',
        'destroy': 'real_estate.type.delete',
        'bulk_delete': 'real_estate.type.delete',
    }
    permission_denied_message = TYPE_ERRORS["type_not_authorized"]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title']
    ordering_fields = ['display_order', 'created_at', 'title']
    ordering = ['display_order', 'title']
    pagination_class = StandardLimitPagination
    
    def get_queryset(self):
        if self.action == 'list':
            return PropertyTypeAdminService.get_type_queryset()
        elif self.action in ['retrieve', 'update', 'partial_update']:
            return PropertyTypeAdminService.get_type_queryset()
        else:
            return PropertyType.objects.all()
    
    def get_serializer_class(self):
        if self.action == 'list':
            return PropertyTypeAdminListSerializer
        elif self.action == 'create':
            return PropertyTypeAdminCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return PropertyTypeAdminUpdateSerializer
        else:
            return PropertyTypeAdminDetailSerializer
    
    def list(self, request, *args, **kwargs):
        filters = {
            'is_active': self._parse_bool(request.query_params.get('is_active')),
        }
        filters = {k: v for k, v in filters.items() if v is not None}
        search = request.query_params.get('search')
        
        queryset = PropertyTypeAdminService.get_type_queryset(filters=filters, search=search)
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return APIResponse.success(
            message=TYPE_SUCCESS["type_list_success"],
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
        
        type_obj = PropertyTypeAdminService.create_type(
            serializer.validated_data,
            created_by=request.user
        )
        
        detail_serializer = PropertyTypeAdminDetailSerializer(type_obj)
        return APIResponse.success(
            message=TYPE_SUCCESS["type_created"],
            data=detail_serializer.data,
            status_code=status.HTTP_201_CREATED
        )
    
    def retrieve(self, request, *args, **kwargs):
        type_obj = PropertyTypeAdminService.get_type_by_id(kwargs.get('pk'))
        
        if not type_obj:
            return APIResponse.error(
                message=TYPE_ERRORS["type_not_found"],
                status_code=status.HTTP_404_NOT_FOUND
            )
        
        serializer = self.get_serializer(type_obj)
        return APIResponse.success(
            message=TYPE_SUCCESS["type_retrieved"],
            data=serializer.data,
            status_code=status.HTTP_200_OK
        )
    
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        type_id = kwargs.get('pk')
        
        serializer = self.get_serializer(data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        
        try:
            updated_type = PropertyTypeAdminService.update_type_by_id(
                type_id,
                serializer.validated_data
            )
            
            detail_serializer = PropertyTypeAdminDetailSerializer(updated_type)
            return APIResponse.success(
                message=TYPE_SUCCESS["type_updated"],
                data=detail_serializer.data,
                status_code=status.HTTP_200_OK
            )
        except PropertyType.DoesNotExist:
            return APIResponse.error(
                message=TYPE_ERRORS["type_not_found"],
                status_code=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return APIResponse.error(
                message=TYPE_ERRORS["type_update_failed"],
                status_code=status.HTTP_400_BAD_REQUEST
            )
    
    def destroy(self, request, *args, **kwargs):
        type_id = kwargs.get('pk')
        
        try:
            PropertyTypeAdminService.delete_type_by_id(type_id)
            return APIResponse.success(
                message=TYPE_SUCCESS["type_deleted"],
                status_code=status.HTTP_200_OK
            )
        except PropertyType.DoesNotExist:
            return APIResponse.error(
                message=TYPE_ERRORS["type_not_found"],
                status_code=status.HTTP_404_NOT_FOUND
            )
        except ValidationError as e:
            error_msg = str(e)
            if "properties" in error_msg:
                count_match = re.search(r'\d+', error_msg)
                count = count_match.group() if count_match else "0"
                message = TYPE_ERRORS["type_has_properties"].format(count=count)
            else:
                message = TYPE_ERRORS["type_delete_failed"]
            return APIResponse.error(
                message=message,
                status_code=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['post'], url_path='bulk-delete')
    def bulk_delete(self, request):
        type_ids = request.data.get('ids', [])
        
        if not type_ids:
            return APIResponse.error(
                message=TYPE_ERRORS.get("type_not_found", "Type IDs required"),
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        if not isinstance(type_ids, list):
            type_ids = [type_ids]
        
        try:
            deleted_count = PropertyTypeAdminService.bulk_delete_types(type_ids)
            return APIResponse.success(
                message=TYPE_SUCCESS.get("type_deleted", "Types deleted successfully"),
                data={'deleted_count': deleted_count},
                status_code=status.HTTP_200_OK
            )
        except ValidationError as e:
            error_msg = str(e)
            if "properties" in error_msg:
                count_match = re.search(r'\d+', error_msg)
                count = count_match.group() if count_match else "0"
                message = TYPE_ERRORS["type_has_properties"].format(count=count)
            else:
                message = TYPE_ERRORS["type_delete_failed"]
            return APIResponse.error(
                message=message,
                status_code=status.HTTP_400_BAD_REQUEST
            )

