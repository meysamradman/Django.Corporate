import re
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from django_filters.rest_framework import DjangoFilterBackend
from django.core.exceptions import ValidationError

from src.real_estate.models.type import PropertyType
from src.real_estate.filters.admin.type_filters import PropertyTypeAdminFilter
from src.real_estate.serializers.admin.type_serializer import (
    PropertyTypeAdminListSerializer,
    PropertyTypeAdminDetailSerializer,
    PropertyTypeAdminCreateSerializer,
    PropertyTypeAdminUpdateSerializer,
    PropertyTypeTreeSerializer
)
from src.real_estate.services.admin.type_services import PropertyTypeAdminService
from src.core.pagination import StandardLimitPagination
from src.user.access_control import real_estate_permission, PermissionRequiredMixin
from src.core.responses.response import APIResponse
from src.real_estate.messages import TYPE_SUCCESS, TYPE_ERRORS


class PropertyTypeAdminViewSet(PermissionRequiredMixin, viewsets.ModelViewSet):
    permission_classes = [real_estate_permission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = PropertyTypeAdminFilter
    search_fields = ['title', 'description']
    ordering_fields = ['path', 'created_at', 'title']
    ordering = ['path']
    pagination_class = StandardLimitPagination
    
    permission_map = {
        'list': 'real_estate.type.read',
        'retrieve': 'real_estate.type.read',
        'create': 'real_estate.type.create',
        'update': 'real_estate.type.update',
        'partial_update': 'real_estate.type.update',
        'destroy': 'real_estate.type.delete',
        'tree': 'real_estate.type.read',
    }
    permission_denied_message = TYPE_ERRORS["type_not_authorized"]
    
    def get_queryset(self):
        if self.action == 'list':
            return PropertyTypeAdminService.get_tree_queryset()
        elif self.action in ['retrieve', 'update', 'partial_update']:
            return PropertyTypeAdminService.get_tree_queryset()
        else:
            return PropertyType.objects.all()
    
    def get_serializer_class(self):
        if self.action == 'list':
            return PropertyTypeAdminListSerializer
        elif self.action == 'create':
            return PropertyTypeAdminCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return PropertyTypeAdminUpdateSerializer
        elif self.action == 'tree':
            return PropertyTypeTreeSerializer
        else:
            return PropertyTypeAdminDetailSerializer

    def list(self, request, *args, **kwargs):
        tree_mode = request.GET.get('tree', '').lower() == 'true'
        if tree_mode:
            tree_data = PropertyTypeAdminService.get_tree_data()
            return APIResponse.success(
                message=TYPE_SUCCESS["type_list_success"],
                data={'data': tree_data},
                status_code=status.HTTP_200_OK
            )

        queryset = self.filter_queryset(PropertyTypeAdminService.get_tree_queryset())
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = PropertyTypeAdminListSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = PropertyTypeAdminListSerializer(queryset, many=True)
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
        
        property_type = PropertyTypeAdminService.create_type(
            serializer.validated_data,
            created_by=request.user
        )
        
        detail_serializer = PropertyTypeAdminDetailSerializer(property_type)
        return APIResponse.success(
            message=TYPE_SUCCESS["type_created"],
            data=detail_serializer.data,
            status_code=status.HTTP_201_CREATED
        )
    
    def retrieve(self, request, *args, **kwargs):
        property_type = PropertyTypeAdminService.get_type_by_id(kwargs.get('pk'))
        
        if not property_type:
            return APIResponse.error(
                message=TYPE_ERRORS["type_not_found"],
                status_code=status.HTTP_404_NOT_FOUND
            )

        serializer = self.get_serializer(property_type)
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
            elif "children" in error_msg:
                count_match = re.search(r'\d+', error_msg)
                count = count_match.group() if count_match else "0"
                message = TYPE_ERRORS["type_has_children"].format(count=count)
            else:
                message = TYPE_ERRORS["type_delete_failed"]
            return APIResponse.error(
                message=message,
                status_code=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get'])
    def tree(self, request):
        tree_data = PropertyTypeAdminService.get_tree_data()
        
        return APIResponse.success(
            message=TYPE_SUCCESS["type_list_success"],
            data=tree_data,
            status_code=status.HTTP_200_OK
        )
    
    @action(detail=False, methods=['get'])
    def roots(self, request):
        root_types = PropertyTypeAdminService.get_root_types()
        
        return APIResponse.success(
            message=TYPE_SUCCESS["type_list_success"],
            data=root_types,
            status_code=status.HTTP_200_OK
        )
    
    @action(detail=True, methods=['get'])
    def children(self, request, pk=None):
        property_type = PropertyTypeAdminService.get_type_by_id(pk)
        
        if not property_type:
            return APIResponse.error(
                message=TYPE_ERRORS["type_not_found"],
                status_code=status.HTTP_404_NOT_FOUND
            )
        
        children = property_type.get_children().filter(is_active=True)
        serializer = PropertyTypeAdminListSerializer(children, many=True)
        
        return APIResponse.success(
            message=TYPE_SUCCESS["type_list_success"],
            data=serializer.data,
            status_code=status.HTTP_200_OK
        )
    
    @action(detail=True, methods=['get'])
    def breadcrumbs(self, request, pk=None):
        property_type = PropertyTypeAdminService.get_type_by_id(pk)
        
        if not property_type:
            return APIResponse.error(
                message=TYPE_ERRORS["type_not_found"],
                status_code=status.HTTP_404_NOT_FOUND
            )
        
        breadcrumbs = PropertyTypeAdminService.get_breadcrumbs(property_type)
        
        return APIResponse.success(
            message=TYPE_SUCCESS["type_retrieved"],
            data=breadcrumbs,
            status_code=status.HTTP_200_OK
        )
    
    @action(detail=True, methods=['post'])
    def move(self, request, pk=None):
        target_id = request.data.get('target_id')
        position = request.data.get('position', 'last-child')
        
        if not target_id:
            return APIResponse.error(
                message=TYPE_ERRORS["type_ids_required"],
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            PropertyTypeAdminService.move_type(pk, target_id, position)
            return APIResponse.success(
                message=TYPE_SUCCESS["type_moved"],
                status_code=status.HTTP_200_OK
            )
        except PropertyType.DoesNotExist:
            return APIResponse.error(
                message=TYPE_ERRORS["type_not_found"],
                status_code=status.HTTP_404_NOT_FOUND
            )
        except ValidationError as e:
            error_msg = str(e)
            if "descendant" in error_msg.lower():
                message = TYPE_ERRORS["type_move_to_descendant"]
            elif "itself" in error_msg.lower():
                message = TYPE_ERRORS["type_move_to_self"]
            else:
                message = TYPE_ERRORS["type_move_failed"].format(error=error_msg)
            return APIResponse.error(
                message=message,
                status_code=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get'])
    def popular(self, request):
        limit = int(request.GET.get('limit', 10))
        popular_types = PropertyTypeAdminService.get_popular_types(limit)
        
        return APIResponse.success(
            message=TYPE_SUCCESS["type_list_success"],
            data=popular_types,
            status_code=status.HTTP_200_OK
        )
    
    @action(detail=False, methods=['post'], url_path='bulk-delete')
    def bulk_delete(self, request):
        type_ids = request.data.get('ids', [])
        
        if not type_ids:
            return APIResponse.error(
                message=TYPE_ERRORS["type_ids_required"],
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        if not isinstance(type_ids, list):
            type_ids = [type_ids]
        
        try:
            deleted_count = PropertyTypeAdminService.bulk_delete_types(type_ids)
            return APIResponse.success(
                message=TYPE_SUCCESS["type_bulk_deleted"],
                data={'deleted_count': deleted_count},
                status_code=status.HTTP_200_OK
            )
        except ValidationError as e:
            error_msg = str(e)
            if "not found" in error_msg.lower():
                message = TYPE_ERRORS["types_not_found"]
            else:
                message = TYPE_ERRORS["type_delete_failed"]
            return APIResponse.error(
                message=message,
                status_code=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        stats = PropertyTypeAdminService.get_type_statistics()
        
        return APIResponse.success(
            message=TYPE_SUCCESS["type_statistics_retrieved"],
            data=stats,
            status_code=status.HTTP_200_OK
        )
