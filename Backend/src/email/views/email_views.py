from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from src.core.responses.response import APIResponse
from src.email.models.email_message import EmailMessage
from src.email.serializers.email_serializer import (
    EmailMessageSerializer,
    EmailMessageCreateSerializer
)
from src.email.messages.messages import EMAIL_SUCCESS, EMAIL_ERRORS
from src.core.pagination import StandardLimitPagination


class EmailMessageViewSet(viewsets.ModelViewSet):
    """
    ViewSet برای مدیریت پیام‌های ایمیل
    
    - POST /api/email/messages/ : ایجاد پیام جدید (عمومی)
    - GET /api/email/messages/ : لیست پیام‌ها (فقط ادمین)
    - GET /api/email/messages/{id}/ : جزئیات پیام (فقط ادمین)
    - PATCH /api/email/messages/{id}/ : به‌روزرسانی پیام (فقط ادمین)
    - DELETE /api/email/messages/{id}/ : حذف پیام (فقط ادمین)
    """
    
    queryset = EmailMessage.objects.all()
    pagination_class = StandardLimitPagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'source']
    search_fields = ['name', 'email', 'subject', 'message', 'phone']
    ordering_fields = ['created_at', 'updated_at', 'status']
    ordering = ['-created_at']
    
    def list(self, request, *args, **kwargs):
        """لیست پیام‌ها"""
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return APIResponse.success(
            message=EMAIL_SUCCESS['message_list_success'],
            data=serializer.data,
            status_code=status.HTTP_200_OK
        )
    
    def get_serializer_class(self):
        if self.action == 'create':
            return EmailMessageCreateSerializer
        return EmailMessageSerializer
    
    def get_permissions(self):
        """
        ایجاد پیام: عمومی (AllowAny)
        سایر عملیات: نیاز به احراز هویت (IsAuthenticated)
        """
        if self.action == 'create':
            return [AllowAny()]
        return [IsAuthenticated()]
    
    def create(self, request, *args, **kwargs):
        """دریافت پیام جدید از فرم تماس"""
        serializer = self.get_serializer(data=request.data, context={'request': request})
        
        if not serializer.is_valid():
            return APIResponse.error(
                message=EMAIL_ERRORS['validation_error'],
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            instance = serializer.save()
            response_serializer = EmailMessageSerializer(instance)
            
            return APIResponse.success(
                message=EMAIL_SUCCESS['message_sent'],
                data=response_serializer.data,
                status_code=status.HTTP_201_CREATED
            )
        except Exception as e:
            return APIResponse.error(
                message=EMAIL_ERRORS['message_create_failed'],
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def retrieve(self, request, *args, **kwargs):
        """دریافت جزئیات یک پیام"""
        try:
            instance = self.get_object()
            serializer = self.get_serializer(instance)
            
            return APIResponse.success(
                message=EMAIL_SUCCESS['message_retrieved'],
                data=serializer.data,
                status_code=status.HTTP_200_OK
            )
        except EmailMessage.DoesNotExist:
            return APIResponse.error(
                message=EMAIL_ERRORS['message_not_found'],
                status_code=status.HTTP_404_NOT_FOUND
            )
    
    def update(self, request, *args, **kwargs):
        """به‌روزرسانی پیام"""
        try:
            instance = self.get_object()
            serializer = self.get_serializer(instance, data=request.data, partial=True)
            
            if not serializer.is_valid():
                return APIResponse.error(
                    message=EMAIL_ERRORS['validation_error'],
                    errors=serializer.errors,
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            
            serializer.save()
            
            return APIResponse.success(
                message=EMAIL_SUCCESS['message_updated'],
                data=serializer.data,
                status_code=status.HTTP_200_OK
            )
        except EmailMessage.DoesNotExist:
            return APIResponse.error(
                message=EMAIL_ERRORS['message_not_found'],
                status_code=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return APIResponse.error(
                message=EMAIL_ERRORS['message_update_failed'],
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def destroy(self, request, *args, **kwargs):
        """حذف پیام"""
        try:
            instance = self.get_object()
            instance.delete()
            
            return APIResponse.success(
                message=EMAIL_SUCCESS['message_deleted'],
                status_code=status.HTTP_200_OK
            )
        except EmailMessage.DoesNotExist:
            return APIResponse.error(
                message=EMAIL_ERRORS['message_not_found'],
                status_code=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return APIResponse.error(
                message=EMAIL_ERRORS['message_delete_failed'],
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def mark_as_read(self, request, pk=None):
        """علامت‌گذاری پیام به عنوان خوانده شده"""
        try:
            message = self.get_object()
            
            if message.status == 'read':
                return APIResponse.error(
                    message=EMAIL_ERRORS['message_already_read'],
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            
            message.mark_as_read()
            serializer = self.get_serializer(message)
            
            return APIResponse.success(
                message=EMAIL_SUCCESS['message_marked_as_read'],
                data=serializer.data,
                status_code=status.HTTP_200_OK
            )
        except EmailMessage.DoesNotExist:
            return APIResponse.error(
                message=EMAIL_ERRORS['message_not_found'],
                status_code=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def mark_as_replied(self, request, pk=None):
        """علامت‌گذاری پیام به عنوان پاسخ داده شده"""
        try:
            message = self.get_object()
            
            if message.status == 'replied':
                return APIResponse.error(
                    message=EMAIL_ERRORS['message_already_replied'],
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            
            message.mark_as_replied(request.user)
            serializer = self.get_serializer(message)
            
            return APIResponse.success(
                message=EMAIL_SUCCESS['message_marked_as_replied'],
                data=serializer.data,
                status_code=status.HTTP_200_OK
            )
        except EmailMessage.DoesNotExist:
            return APIResponse.error(
                message=EMAIL_ERRORS['message_not_found'],
                status_code=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def stats(self, request):
        """آمار پیام‌ها"""
        try:
            stats = {
                'total': EmailMessage.objects.count(),
                'new': EmailMessage.objects.filter(status='new').count(),
                'read': EmailMessage.objects.filter(status='read').count(),
                'replied': EmailMessage.objects.filter(status='replied').count(),
                'archived': EmailMessage.objects.filter(status='archived').count(),
                'draft': EmailMessage.objects.filter(status='draft').count(),
            }
            
            return APIResponse.success(
                message=EMAIL_SUCCESS['statistics_retrieved'],
                data=stats,
                status_code=status.HTTP_200_OK
            )
        except Exception as e:
            return APIResponse.error(
                message=EMAIL_ERRORS['message_not_found'],
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def save_as_draft(self, request, pk=None):
        """ذخیره پیام به عنوان پیش‌نویس"""
        try:
            message = self.get_object()
            message.save_as_draft(request.user)
            serializer = self.get_serializer(message)
            
            return APIResponse.success(
                message="پیش‌نویس با موفقیت ذخیره شد",
                data=serializer.data,
                status_code=status.HTTP_200_OK
            )
        except EmailMessage.DoesNotExist:
            return APIResponse.error(
                message=EMAIL_ERRORS['message_not_found'],
                status_code=status.HTTP_404_NOT_FOUND
            )

