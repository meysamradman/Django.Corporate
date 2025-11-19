from rest_framework import viewsets, status
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from django.core.exceptions import ValidationError

from src.core.responses.response import APIResponse
from src.settings.models import ContactPhone
from src.settings.serializers.contact_phone_serializer import ContactPhoneSerializer
from src.settings.services.contact_phone_service import (
    get_contact_phones,
    create_contact_phone,
    update_contact_phone,
    delete_contact_phone,
)
from src.settings.messages.messages import SETTINGS_SUCCESS, SETTINGS_ERRORS
from src.user.authorization.admin_permission import SettingsManagerAccess
from src.user.permissions import PermissionValidator


class ContactPhoneViewSet(viewsets.ModelViewSet):
    """ViewSet for managing contact phones"""
    
    queryset = ContactPhone.objects.all()
    serializer_class = ContactPhoneSerializer
    permission_classes = [SettingsManagerAccess]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['is_active']
    search_fields = ['phone_number', 'label']
    ordering_fields = ['order', 'created_at']
    ordering = ['order', '-created_at']
    
    def list(self, request, *args, **kwargs):
        """List contact phones"""
        if not PermissionValidator.has_permission(request.user, 'settings.manage'):
            return APIResponse.error(
                message=SETTINGS_ERRORS.get("settings_not_authorized", "You don't have permission to view settings"),
                status_code=status.HTTP_403_FORBIDDEN
            )
        filters = {}
        if 'is_active' in request.query_params:
            filters['is_active'] = request.query_params['is_active'] == 'true'
        
        ordering = None
        if 'ordering' in request.query_params:
            ordering = [request.query_params['ordering']]
        
        queryset = get_contact_phones(filters=filters, ordering=ordering)
        serializer = self.get_serializer(queryset, many=True)
        
        return APIResponse.success(
            message=SETTINGS_SUCCESS.get('phone_list_retrieved', SETTINGS_SUCCESS['phone_created']),
            data=serializer.data,
            status_code=status.HTTP_200_OK
        )
    
    def create(self, request, *args, **kwargs):
        """Create new contact phone"""
        if not PermissionValidator.has_permission(request.user, 'settings.manage'):
            return APIResponse.error(
                message=SETTINGS_ERRORS.get("settings_not_authorized", "You don't have permission to update settings"),
                status_code=status.HTTP_403_FORBIDDEN
            )
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            instance = create_contact_phone(serializer.validated_data)
            response_serializer = self.get_serializer(instance)
            
            return APIResponse.success(
                message=SETTINGS_SUCCESS['phone_created'],
                data=response_serializer.data,
                status_code=status.HTTP_201_CREATED
            )
        except ValidationError as e:
            error_msg = str(e)
            if "invalid" in error_msg.lower():
                message = SETTINGS_ERRORS['invalid_phone']
            else:
                message = SETTINGS_ERRORS.get('phone_create_failed', SETTINGS_ERRORS['phone_not_found'])
            
            return APIResponse.error(
                message=message,
                errors=serializer.errors if hasattr(serializer, 'errors') else None,
                status_code=status.HTTP_400_BAD_REQUEST
            )
    
    def update(self, request, *args, **kwargs):
        """Update contact phone"""
        if not PermissionValidator.has_permission(request.user, 'settings.manage'):
            return APIResponse.error(
                message=SETTINGS_ERRORS.get("settings_not_authorized", "You don't have permission to update settings"),
                status_code=status.HTTP_403_FORBIDDEN
            )
        try:
            instance = self.get_object()
            serializer = self.get_serializer(instance, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            
            updated_instance = update_contact_phone(instance, serializer.validated_data)
            response_serializer = self.get_serializer(updated_instance)
            
            return APIResponse.success(
                message=SETTINGS_SUCCESS['phone_updated'],
                data=response_serializer.data,
                status_code=status.HTTP_200_OK
            )
        except ContactPhone.DoesNotExist:
            return APIResponse.error(
                message=SETTINGS_ERRORS['phone_not_found'],
                status_code=status.HTTP_404_NOT_FOUND
            )
        except ValidationError as e:
            error_msg = str(e)
            if "invalid" in error_msg.lower():
                message = SETTINGS_ERRORS['invalid_phone']
            else:
                message = SETTINGS_ERRORS.get('phone_update_failed', SETTINGS_ERRORS['phone_not_found'])
            
            return APIResponse.error(
                message=message,
                status_code=status.HTTP_400_BAD_REQUEST
            )
    
    def destroy(self, request, *args, **kwargs):
        """Delete contact phone"""
        if not PermissionValidator.has_permission(request.user, 'settings.manage'):
            return APIResponse.error(
                message=SETTINGS_ERRORS.get("settings_not_authorized", "You don't have permission to update settings"),
                status_code=status.HTTP_403_FORBIDDEN
            )
        try:
            instance = self.get_object()
            delete_contact_phone(instance)
            
            return APIResponse.success(
                message=SETTINGS_SUCCESS['phone_deleted'],
                status_code=status.HTTP_200_OK
            )
        except ContactPhone.DoesNotExist:
            return APIResponse.error(
                message=SETTINGS_ERRORS['phone_not_found'],
                status_code=status.HTTP_404_NOT_FOUND
            )
        except ValidationError as e:
            return APIResponse.error(
                message=SETTINGS_ERRORS.get('phone_delete_failed', SETTINGS_ERRORS['phone_not_found']),
                status_code=status.HTTP_400_BAD_REQUEST
            )
