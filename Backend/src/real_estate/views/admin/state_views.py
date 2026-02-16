from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError as DRFValidationError
from django_filters.rest_framework import DjangoFilterBackend
from django.core.exceptions import ValidationError as DjangoValidationError

from src.core.responses.response import APIResponse
from src.core.pagination import StandardLimitPagination
from src.user.access_control import real_estate_permission, PermissionRequiredMixin

from src.real_estate.models.state import PropertyState
from src.real_estate.filters.admin.state_filters import PropertyStateAdminFilter
from src.real_estate.serializers.admin.state_serializer import (
    PropertyStateAdminListSerializer,
    PropertyStateAdminDetailSerializer,
    PropertyStateAdminCreateSerializer,
    PropertyStateAdminUpdateSerializer,
)
from src.real_estate.services.admin.state_services import PropertyStateAdminService
from src.real_estate.messages.messages import STATE_SUCCESS, STATE_ERRORS
from src.core.utils.validation_helpers import extract_validation_message, normalize_validation_error

class PropertyStateAdminViewSet(PermissionRequiredMixin, viewsets.ModelViewSet):
    permission_classes = [real_estate_permission]
    
    permission_map = {
        'list': 'real_estate.state.read',
        'retrieve': 'real_estate.state.read',
        'create': 'real_estate.state.create',
        'update': 'real_estate.state.update',
        'partial_update': 'real_estate.state.update',
        'destroy': 'real_estate.state.delete',
        'bulk_delete': 'real_estate.state.delete',
        'field_options': 'real_estate.state.read',
    }
    permission_denied_message = STATE_ERRORS["state_not_authorized"]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = PropertyStateAdminFilter
    search_fields = ['title']
    ordering_fields = ['created_at', 'title']
    ordering = ['-created_at']
    pagination_class = StandardLimitPagination

    def get_queryset(self):
        if self.action == 'list':
            return PropertyStateAdminService.get_state_queryset()
        elif self.action in ['retrieve', 'update', 'partial_update']:
            return PropertyStateAdminService.get_state_queryset()
        else:
            return PropertyState.objects.all()
    
    def get_serializer_class(self):
        if self.action == 'list':
            return PropertyStateAdminListSerializer
        elif self.action == 'create':
            return PropertyStateAdminCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return PropertyStateAdminUpdateSerializer
        else:
            return PropertyStateAdminDetailSerializer
    
    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return APIResponse.success(
            message=STATE_SUCCESS["state_list_success"],
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
        try:
            serializer.is_valid(raise_exception=True)

            state_obj = PropertyStateAdminService.create_state(
                serializer.validated_data,
                created_by=request.user
            )

            detail_serializer = PropertyStateAdminDetailSerializer(state_obj)
            return APIResponse.success(
                message=STATE_SUCCESS["state_created"],
                data=detail_serializer.data,
                status_code=status.HTTP_201_CREATED
            )
        except (DRFValidationError, DjangoValidationError) as e:
            return APIResponse.error(
                message=extract_validation_message(e, STATE_ERRORS["state_create_failed"]),
                errors=normalize_validation_error(e),
                status_code=status.HTTP_400_BAD_REQUEST
            )
    
    def retrieve(self, request, *args, **kwargs):
        state_obj = PropertyStateAdminService.get_state_by_id(kwargs.get('pk'))
        
        if not state_obj:
            return APIResponse.error(
                message=STATE_ERRORS["state_not_found"],
                status_code=status.HTTP_404_NOT_FOUND
            )
        
        serializer = self.get_serializer(state_obj)
        return APIResponse.success(
            message=STATE_SUCCESS["state_retrieved"],
            data=serializer.data,
            status_code=status.HTTP_200_OK
        )
    
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        state_id = kwargs.get('pk')
        state_obj = PropertyStateAdminService.get_state_by_id(state_id)

        if not state_obj:
            return APIResponse.error(
                message=STATE_ERRORS["state_not_found"],
                status_code=status.HTTP_404_NOT_FOUND
            )

        serializer = self.get_serializer(state_obj, data=request.data, partial=partial)

        try:
            serializer.is_valid(raise_exception=True)

            updated_state = PropertyStateAdminService.update_state_by_id(
                state_id,
                serializer.validated_data
            )
            
            detail_serializer = PropertyStateAdminDetailSerializer(updated_state)
            return APIResponse.success(
                message=STATE_SUCCESS["state_updated"],
                data=detail_serializer.data,
                status_code=status.HTTP_200_OK
            )
        except PropertyState.DoesNotExist:
            return APIResponse.error(
                message=STATE_ERRORS["state_not_found"],
                status_code=status.HTTP_404_NOT_FOUND
            )
        except (DRFValidationError, DjangoValidationError) as e:
            return APIResponse.error(
                message=extract_validation_message(e, STATE_ERRORS["state_update_failed"]),
                errors=normalize_validation_error(e),
                status_code=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get'], url_path='field-options')
    def field_options(self, request):
        
        from src.real_estate.models.constants import get_listing_type_choices_list
        return APIResponse.success(
            data={
                'usage_type': get_listing_type_choices_list()
            },
            status_code=status.HTTP_200_OK
        )

    def destroy(self, request, *args, **kwargs):
        state_id = kwargs.get('pk')
        
        try:
            PropertyStateAdminService.delete_state_by_id(state_id)
            return APIResponse.success(
                message=STATE_SUCCESS["state_deleted"],
                status_code=status.HTTP_200_OK
            )
        except PropertyState.DoesNotExist:
            return APIResponse.error(
                message=STATE_ERRORS["state_not_found"],
                status_code=status.HTTP_404_NOT_FOUND
            )
        except DjangoValidationError as e:
            return APIResponse.error(
                message=extract_validation_message(e, STATE_ERRORS["state_delete_failed"]),
                errors=normalize_validation_error(e),
                status_code=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['post'], url_path='bulk-delete')
    def bulk_delete(self, request):
        state_ids = request.data.get('ids', [])
        
        if not state_ids:
            return APIResponse.error(
                message=STATE_ERRORS["state_ids_required"],
                errors={'ids': [STATE_ERRORS["state_ids_required"]]},
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        if not isinstance(state_ids, list):
            state_ids = [state_ids]
        
        try:
            deleted_count = PropertyStateAdminService.bulk_delete_states(state_ids)
            return APIResponse.success(
                message=STATE_SUCCESS["state_bulk_deleted"],
                data={'deleted_count': deleted_count},
                status_code=status.HTTP_200_OK
            )
        except DjangoValidationError as e:
            return APIResponse.error(
                message=extract_validation_message(e, STATE_ERRORS["state_delete_failed"]),
                errors=normalize_validation_error(e),
                status_code=status.HTTP_400_BAD_REQUEST
            )

