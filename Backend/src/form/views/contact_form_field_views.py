from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from django.core.exceptions import ValidationError
from django.core.cache import cache

from src.core.responses.response import APIResponse
from src.core.pagination import StandardLimitPagination
from src.form.models import ContactFormField
from src.form.serializers import (
    ContactFormFieldSerializer,
    ContactFormFieldCreateSerializer,
    ContactFormFieldUpdateSerializer,
)
from src.form.services.contact_form_field_service import (
    get_contact_form_fields,
    get_contact_form_field,
    create_contact_form_field,
    update_contact_form_field,
    delete_contact_form_field,
    get_active_fields_for_platform,
)
from src.form.messages.messages import FORM_FIELD_SUCCESS, FORM_FIELD_ERRORS
from src.user.access_control import PermissionRequiredMixin
from src.form.utils.cache import FormCacheKeys, FormCacheManager

class ContactFormFieldViewSet(PermissionRequiredMixin, viewsets.ModelViewSet):
    
    queryset = ContactFormField.objects.all()
    pagination_class = StandardLimitPagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['is_active', 'field_type', 'required']
    search_fields = ['field_key', 'label', 'placeholder']
    ordering_fields = ['order', 'created_at', 'field_key']
    ordering = ['order', 'field_key']
    
    permission_map = {
        'list': 'forms.manage',
        'retrieve': 'forms.manage',
        'create': 'forms.manage',
        'update': 'forms.manage',
        'partial_update': 'forms.manage',
        'destroy': 'forms.manage',
    }
    permission_denied_message = FORM_FIELD_ERRORS.get('permission_denied', 'شما اجازه دسترسی به این بخش را ندارید')
    
    def get_serializer_class(self):
        if self.action == 'create':
            return ContactFormFieldCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return ContactFormFieldUpdateSerializer
        return ContactFormFieldSerializer
    
    def list(self, request, *args, **kwargs):
        try:
            is_active = request.query_params.get('is_active')
            if is_active is not None:
                is_active = is_active.lower() == 'true'
            
            queryset = get_contact_form_fields(is_active=is_active)
            queryset = self.filter_queryset(queryset)
            
            page = self.paginate_queryset(queryset)
            if page is not None:
                serializer = self.get_serializer(page, many=True)
                return self.get_paginated_response(serializer.data)
            
            serializer = self.get_serializer(queryset, many=True)
            return APIResponse.success(
                data=serializer.data,
                status_code=status.HTTP_200_OK
            )
        except Exception as e:
            return APIResponse.error(
                message=FORM_FIELD_ERRORS['field_list_failed'],
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def retrieve(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            serializer = self.get_serializer(instance)
            
            return APIResponse.success(
                data=serializer.data,
                status_code=status.HTTP_200_OK
            )
        except ContactFormField.DoesNotExist:
            return APIResponse.error(
                message=FORM_FIELD_ERRORS['field_not_found'],
                status_code=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return APIResponse.error(
                message=FORM_FIELD_ERRORS['field_retrieve_failed'],
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        
        if not serializer.is_valid():
            errors = serializer.errors
            error_message = FORM_FIELD_ERRORS.get('validation_error', 'Validation error')
            
            if 'field_key' in errors:
                field_key_error = errors['field_key']
                if isinstance(field_key_error, list) and len(field_key_error) > 0:
                    error_message = field_key_error[0]
                elif isinstance(field_key_error, str):
                    error_message = field_key_error
            
            return APIResponse.error(
                message=error_message,
                errors=errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            field = create_contact_form_field(serializer.validated_data)
            FormCacheManager.invalidate_fields()
            response_serializer = ContactFormFieldSerializer(field)
            
            return APIResponse.success(
                message=FORM_FIELD_SUCCESS['field_created'],
                data=response_serializer.data,
                status_code=status.HTTP_201_CREATED
            )
        except ValidationError as e:
            error_msg = str(e)
            if "unique" in error_msg.lower() or "duplicate" in error_msg.lower():
                message = FORM_FIELD_ERRORS['duplicate_field_key']
            elif "validation" in error_msg.lower():
                message = FORM_FIELD_ERRORS['validation_error']
            else:
                message = FORM_FIELD_ERRORS['field_create_failed']
            
            return APIResponse.error(
                message=message,
                errors=serializer.errors if hasattr(serializer, 'errors') else None,
                status_code=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return APIResponse.error(
                message=FORM_FIELD_ERRORS['field_create_failed'],
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def update(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            serializer = self.get_serializer(instance, data=request.data, partial=kwargs.get('partial', False))
            serializer.is_valid(raise_exception=True)
            
            updated_field = update_contact_form_field(instance, serializer.validated_data)
            FormCacheManager.invalidate_field(field_id=instance.id, field_key=instance.field_key)
            response_serializer = ContactFormFieldSerializer(updated_field)
            
            return APIResponse.success(
                message=FORM_FIELD_SUCCESS['field_updated'],
                data=response_serializer.data,
                status_code=status.HTTP_200_OK
            )
        except ContactFormField.DoesNotExist:
            return APIResponse.error(
                message=FORM_FIELD_ERRORS['field_not_found'],
                status_code=status.HTTP_404_NOT_FOUND
            )
        except ValidationError as e:
            error_msg = str(e)
            if "validation" in error_msg.lower():
                message = FORM_FIELD_ERRORS['validation_error']
            else:
                message = FORM_FIELD_ERRORS['field_update_failed']
            
            return APIResponse.error(
                message=message,
                errors=serializer.errors if hasattr(serializer, 'errors') else None,
                status_code=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return APIResponse.error(
                message=FORM_FIELD_ERRORS['field_update_failed'],
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def destroy(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            field_key = instance.field_key
            delete_contact_form_field(instance)
            FormCacheManager.invalidate_field(field_id=instance.id, field_key=field_key)
            
            return APIResponse.success(
                message=FORM_FIELD_SUCCESS['field_deleted'],
                status_code=status.HTTP_200_OK
            )
        except ContactFormField.DoesNotExist:
            return APIResponse.error(
                message=FORM_FIELD_ERRORS['field_not_found'],
                status_code=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return APIResponse.error(
                message=FORM_FIELD_ERRORS['field_delete_failed'],
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def get_fields_for_platform(self, request):
        platform = request.query_params.get('platform', 'website')
        
        if platform not in ['website', 'mobile_app']:
            return APIResponse.error(
                message=FORM_FIELD_ERRORS['invalid_platform'],
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            cache_key = FormCacheKeys.fields_for_platform(platform)
            cached_data = cache.get(cache_key)
            
            if cached_data is not None:
                return APIResponse.success(
                    data=cached_data,
                    status_code=status.HTTP_200_OK
                )
            
            fields = get_active_fields_for_platform(platform)
            serializer = self.get_serializer(fields, many=True)
            serialized_data = serializer.data
            
            cache.set(cache_key, serialized_data, 300)
            
            return APIResponse.success(
                data=serialized_data,
                status_code=status.HTTP_200_OK
            )
        except ValidationError:
            return APIResponse.error(
                message=FORM_FIELD_ERRORS["validation_error"],
                status_code=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return APIResponse.error(
                message=FORM_FIELD_ERRORS['platform_fields_failed'],
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

