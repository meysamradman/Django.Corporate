from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from django_filters.rest_framework import DjangoFilterBackend

from src.core.responses.response import APIResponse
from src.core.pagination import StandardLimitPagination
from src.user.access_control import real_estate_permission, PermissionRequiredMixin

from src.real_estate.models.feature import PropertyFeature
from src.real_estate.filters.admin.feature_filters import PropertyFeatureAdminFilter
from src.real_estate.serializers.admin.feature_serializer import (
    PropertyFeatureAdminListSerializer,
    PropertyFeatureAdminDetailSerializer,
    PropertyFeatureAdminCreateSerializer,
    PropertyFeatureAdminUpdateSerializer,
)
from src.real_estate.services.admin.feature_services import PropertyFeatureAdminService
from src.real_estate.messages.messages import FEATURE_SUCCESS, FEATURE_ERRORS

class PropertyFeatureAdminViewSet(PermissionRequiredMixin, viewsets.ModelViewSet):
    permission_classes = [real_estate_permission]
    
    permission_map = {
        'list': 'real_estate.feature.read',
        'retrieve': 'real_estate.feature.read',
        'create': 'real_estate.feature.create',
        'update': 'real_estate.feature.update',
        'partial_update': 'real_estate.feature.update',
        'destroy': 'real_estate.feature.delete',
        'bulk_delete': 'real_estate.feature.delete',
    }
    permission_denied_message = FEATURE_ERRORS["feature_not_authorized"]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = PropertyFeatureAdminFilter
    search_fields = ['title', 'group']
    ordering_fields = ['group', 'created_at', 'title']
    ordering = ['-created_at']
    pagination_class = StandardLimitPagination
    
    def get_queryset(self):
        if self.action == 'list':
            return PropertyFeatureAdminService.get_feature_queryset()
        elif self.action in ['retrieve', 'update', 'partial_update']:
            return PropertyFeatureAdminService.get_feature_queryset()
        else:
            return PropertyFeature.objects.all()
    
    def get_serializer_class(self):
        if self.action == 'list':
            return PropertyFeatureAdminListSerializer
        elif self.action == 'create':
            return PropertyFeatureAdminCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return PropertyFeatureAdminUpdateSerializer
        else:
            return PropertyFeatureAdminDetailSerializer
    
    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return APIResponse.success(
            message=FEATURE_SUCCESS["feature_list_success"],
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
        
        feature_obj = PropertyFeatureAdminService.create_feature(
            serializer.validated_data,
            created_by=request.user
        )
        
        detail_serializer = PropertyFeatureAdminDetailSerializer(feature_obj)
        return APIResponse.success(
            message=FEATURE_SUCCESS["feature_created"],
            data=detail_serializer.data,
            status_code=status.HTTP_201_CREATED
        )
    
    def retrieve(self, request, *args, **kwargs):
        feature_obj = PropertyFeatureAdminService.get_feature_by_id(kwargs.get('pk'))
        
        if not feature_obj:
            return APIResponse.error(
                message=FEATURE_ERRORS["feature_not_found"],
                status_code=status.HTTP_404_NOT_FOUND
            )
        
        serializer = self.get_serializer(feature_obj)
        return APIResponse.success(
            message=FEATURE_SUCCESS["feature_retrieved"],
            data=serializer.data,
            status_code=status.HTTP_200_OK
        )
    
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        feature_id = kwargs.get('pk')
        
        serializer = self.get_serializer(data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        
        try:
            updated_feature = PropertyFeatureAdminService.update_feature_by_id(
                feature_id,
                serializer.validated_data
            )
            
            detail_serializer = PropertyFeatureAdminDetailSerializer(updated_feature)
            return APIResponse.success(
                message=FEATURE_SUCCESS["feature_updated"],
                data=detail_serializer.data,
                status_code=status.HTTP_200_OK
            )
        except PropertyFeature.DoesNotExist:
            return APIResponse.error(
                message=FEATURE_ERRORS["feature_not_found"],
                status_code=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return APIResponse.error(
                message=FEATURE_ERRORS["feature_update_failed"],
                status_code=status.HTTP_400_BAD_REQUEST
            )
    
    def destroy(self, request, *args, **kwargs):
        feature_id = kwargs.get('pk')
        
        try:
            PropertyFeatureAdminService.delete_feature_by_id(feature_id)
            return APIResponse.success(
                message=FEATURE_SUCCESS["feature_deleted"],
                status_code=status.HTTP_200_OK
            )
        except PropertyFeature.DoesNotExist:
            return APIResponse.error(
                message=FEATURE_ERRORS["feature_not_found"],
                status_code=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return APIResponse.error(
                message=FEATURE_ERRORS["feature_delete_failed"],
                status_code=status.HTTP_400_BAD_REQUEST
            )

