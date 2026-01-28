from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from django_filters.rest_framework import DjangoFilterBackend

from src.core.responses.response import APIResponse
from src.core.pagination import StandardLimitPagination
from src.user.access_control import real_estate_permission, PermissionRequiredMixin

from src.real_estate.models.label import PropertyLabel
from src.real_estate.filters.admin.label_filters import PropertyLabelAdminFilter
from src.real_estate.serializers.admin.label_serializer import (
    PropertyLabelAdminListSerializer,
    PropertyLabelAdminDetailSerializer,
    PropertyLabelAdminCreateSerializer,
    PropertyLabelAdminUpdateSerializer,
)
from src.real_estate.services.admin.label_services import PropertyLabelAdminService
from src.real_estate.messages.messages import LABEL_SUCCESS, LABEL_ERRORS

class PropertyLabelAdminViewSet(PermissionRequiredMixin, viewsets.ModelViewSet):
    permission_classes = [real_estate_permission]
    
    permission_map = {
        'list': 'real_estate.label.read',
        'retrieve': 'real_estate.label.read',
        'create': 'real_estate.label.create',
        'update': 'real_estate.label.update',
        'partial_update': 'real_estate.label.update',
        'destroy': 'real_estate.label.delete',
    }
    permission_denied_message = LABEL_ERRORS["label_not_authorized"]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = PropertyLabelAdminFilter
    search_fields = ['title']
    ordering_fields = ['created_at', 'title']
    ordering = ['-created_at']
    pagination_class = StandardLimitPagination
    
    def get_queryset(self):
        if self.action == 'list':
            return PropertyLabelAdminService.get_label_queryset()
        elif self.action in ['retrieve', 'update', 'partial_update']:
            return PropertyLabelAdminService.get_label_queryset()
        else:
            return PropertyLabel.objects.all()
    
    def get_serializer_class(self):
        if self.action == 'list':
            return PropertyLabelAdminListSerializer
        elif self.action == 'create':
            return PropertyLabelAdminCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return PropertyLabelAdminUpdateSerializer
        else:
            return PropertyLabelAdminDetailSerializer
    
    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return APIResponse.success(
            message=LABEL_SUCCESS["label_list_success"],
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
        
        label_obj = PropertyLabelAdminService.create_label(
            serializer.validated_data,
            created_by=request.user
        )
        
        detail_serializer = PropertyLabelAdminDetailSerializer(label_obj)
        return APIResponse.success(
            message=LABEL_SUCCESS["label_created"],
            data=detail_serializer.data,
            status_code=status.HTTP_201_CREATED
        )
    
    def retrieve(self, request, *args, **kwargs):
        label_obj = PropertyLabelAdminService.get_label_by_id(kwargs.get('pk'))
        
        if not label_obj:
            return APIResponse.error(
                message=LABEL_ERRORS["label_not_found"],
                status_code=status.HTTP_404_NOT_FOUND
            )
        
        serializer = self.get_serializer(label_obj)
        return APIResponse.success(
            message=LABEL_SUCCESS["label_retrieved"],
            data=serializer.data,
            status_code=status.HTTP_200_OK
        )
    
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        label_id = kwargs.get('pk')
        
        serializer = self.get_serializer(data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        
        try:
            updated_label = PropertyLabelAdminService.update_label_by_id(
                label_id,
                serializer.validated_data
            )
            
            detail_serializer = PropertyLabelAdminDetailSerializer(updated_label)
            return APIResponse.success(
                message=LABEL_SUCCESS["label_updated"],
                data=detail_serializer.data,
                status_code=status.HTTP_200_OK
            )
        except PropertyLabel.DoesNotExist:
            return APIResponse.error(
                message=LABEL_ERRORS["label_not_found"],
                status_code=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return APIResponse.error(
                message=LABEL_ERRORS["label_update_failed"],
                status_code=status.HTTP_400_BAD_REQUEST
            )
    
    def destroy(self, request, *args, **kwargs):
        label_id = kwargs.get('pk')
        
        try:
            PropertyLabelAdminService.delete_label_by_id(label_id)
            return APIResponse.success(
                message=LABEL_SUCCESS["label_deleted"],
                status_code=status.HTTP_200_OK
            )
        except PropertyLabel.DoesNotExist:
            return APIResponse.error(
                message=LABEL_ERRORS["label_not_found"],
                status_code=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return APIResponse.error(
                message=LABEL_ERRORS["label_delete_failed"],
                status_code=status.HTTP_400_BAD_REQUEST
            )

