from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from django.core.exceptions import ValidationError

from src.core.responses.response import APIResponse
from src.settings.models import ContactEmail
from src.settings.serializers.contact_email_serializer import ContactEmailSerializer
from src.settings.services.contact_email_service import (
    get_contact_emails,
    create_contact_email,
    update_contact_email,
    delete_contact_email,
)
from src.settings.messages.messages import SETTINGS_SUCCESS, SETTINGS_ERRORS


class ContactEmailViewSet(viewsets.ModelViewSet):
    """ViewSet for managing contact emails"""
    
    queryset = ContactEmail.objects.all()
    serializer_class = ContactEmailSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['is_active']
    search_fields = ['email', 'label']
    ordering_fields = ['order', 'created_at']
    ordering = ['order', '-created_at']
    
    def list(self, request, *args, **kwargs):
        """List contact emails"""
        filters = {}
        if 'is_active' in request.query_params:
            filters['is_active'] = request.query_params['is_active'] == 'true'
        
        ordering = None
        if 'ordering' in request.query_params:
            ordering = [request.query_params['ordering']]
        
        queryset = get_contact_emails(filters=filters, ordering=ordering)
        serializer = self.get_serializer(queryset, many=True)
        
        return APIResponse.success(
            message=SETTINGS_SUCCESS.get('email_list_retrieved', SETTINGS_SUCCESS['email_created']),
            data=serializer.data,
            status_code=status.HTTP_200_OK
        )
    
    def create(self, request, *args, **kwargs):
        """Create new contact email"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            instance = create_contact_email(serializer.validated_data)
            response_serializer = self.get_serializer(instance)
            
            return APIResponse.success(
                message=SETTINGS_SUCCESS['email_created'],
                data=response_serializer.data,
                status_code=status.HTTP_201_CREATED
            )
        except ValidationError as e:
            error_msg = str(e)
            if "duplicate" in error_msg.lower() or "unique" in error_msg.lower():
                message = SETTINGS_ERRORS['duplicate_email']
            elif "invalid" in error_msg.lower():
                message = SETTINGS_ERRORS['invalid_email']
            else:
                message = SETTINGS_ERRORS.get('email_create_failed', SETTINGS_ERRORS['email_not_found'])
            
            return APIResponse.error(
                message=message,
                errors=serializer.errors if hasattr(serializer, 'errors') else None,
                status_code=status.HTTP_400_BAD_REQUEST
            )
    
    def update(self, request, *args, **kwargs):
        """Update contact email"""
        try:
            instance = self.get_object()
            serializer = self.get_serializer(instance, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            
            updated_instance = update_contact_email(instance, serializer.validated_data)
            response_serializer = self.get_serializer(updated_instance)
            
            return APIResponse.success(
                message=SETTINGS_SUCCESS['email_updated'],
                data=response_serializer.data,
                status_code=status.HTTP_200_OK
            )
        except ContactEmail.DoesNotExist:
            return APIResponse.error(
                message=SETTINGS_ERRORS['email_not_found'],
                status_code=status.HTTP_404_NOT_FOUND
            )
        except ValidationError as e:
            error_msg = str(e)
            if "duplicate" in error_msg.lower() or "unique" in error_msg.lower():
                message = SETTINGS_ERRORS['duplicate_email']
            elif "invalid" in error_msg.lower():
                message = SETTINGS_ERRORS['invalid_email']
            else:
                message = SETTINGS_ERRORS.get('email_update_failed', SETTINGS_ERRORS['email_not_found'])
            
            return APIResponse.error(
                message=message,
                status_code=status.HTTP_400_BAD_REQUEST
            )
    
    def destroy(self, request, *args, **kwargs):
        """Delete contact email"""
        try:
            instance = self.get_object()
            delete_contact_email(instance)
            
            return APIResponse.success(
                message=SETTINGS_SUCCESS['email_deleted'],
                status_code=status.HTTP_200_OK
            )
        except ContactEmail.DoesNotExist:
            return APIResponse.error(
                message=SETTINGS_ERRORS['email_not_found'],
                status_code=status.HTTP_404_NOT_FOUND
            )
        except ValidationError as e:
            return APIResponse.error(
                message=SETTINGS_ERRORS.get('email_delete_failed', SETTINGS_ERRORS['email_not_found']),
                status_code=status.HTTP_400_BAD_REQUEST
            )
