from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from django.core.exceptions import ValidationError

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
from src.user.authorization.admin_permission import RequirePermission


class ContactFormFieldViewSet(viewsets.ModelViewSet):
    
    queryset = ContactFormField.objects.all()
    pagination_class = StandardLimitPagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['is_active', 'field_type', 'required']
    search_fields = ['field_key', 'label', 'placeholder']
    ordering_fields = ['order', 'created_at', 'field_key']
    ordering = ['order', 'field_key']
    
    def get_serializer_class(self):
        """انتخاب serializer مناسب"""
        if self.action == 'create':
            return ContactFormFieldCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return ContactFormFieldUpdateSerializer
        return ContactFormFieldSerializer
    
    def get_permissions(self):
        """تعیین دسترسی‌ها"""
        if self.action == 'get_fields_for_platform':
            return [AllowAny()]
        return [RequirePermission('forms.manage')]
    
    def list(self, request, *args, **kwargs):
        """لیست فیلدها"""
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
                message=FORM_FIELD_SUCCESS['field_list_retrieved'],
                data=serializer.data,
                status_code=status.HTTP_200_OK
            )
        except Exception as e:
            return APIResponse.error(
                message=FORM_FIELD_ERRORS['field_list_failed'],
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def retrieve(self, request, *args, **kwargs):
        """دریافت جزئیات فیلد"""
        try:
            instance = self.get_object()
            serializer = self.get_serializer(instance)
            
            return APIResponse.success(
                message=FORM_FIELD_SUCCESS['field_retrieved'],
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
        """ایجاد فیلد جدید"""
        serializer = self.get_serializer(data=request.data)
        
        if not serializer.is_valid():
            # نمایش خطاهای validation به صورت واضح
            errors = serializer.errors
            error_message = "خطا در اعتبارسنجی داده‌ها"
            
            # اگر خطای field_key وجود دارد، پیام واضح‌تری بده
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
        """به‌روزرسانی فیلد"""
        try:
            instance = self.get_object()
            serializer = self.get_serializer(instance, data=request.data, partial=kwargs.get('partial', False))
            serializer.is_valid(raise_exception=True)
            
            updated_field = update_contact_form_field(instance, serializer.validated_data)
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
        """حذف فیلد"""
        try:
            instance = self.get_object()
            delete_contact_form_field(instance)
            
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
        """
        دریافت فیلدهای فعال برای یک پلتفرم خاص
        GET /api/form/fields/get_fields_for_platform/?platform=website
        """
        platform = request.query_params.get('platform', 'website')
        
        if platform not in ['website', 'mobile_app']:
            return APIResponse.error(
                message=FORM_FIELD_ERRORS['invalid_platform'],
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            fields = get_active_fields_for_platform(platform)
            serializer = self.get_serializer(fields, many=True)
            
            return APIResponse.success(
                message=FORM_FIELD_SUCCESS['platform_fields_retrieved'],
                data=serializer.data,
                status_code=status.HTTP_200_OK
            )
        except ValidationError as e:
            return APIResponse.error(
                message=str(e),
                status_code=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return APIResponse.error(
                message=FORM_FIELD_ERRORS['platform_fields_failed'],
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

