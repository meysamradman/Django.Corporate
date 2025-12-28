from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import AllowAny

from src.core.pagination import StandardLimitPagination
from src.core.responses.response import APIResponse
from src.email.messages.messages import EMAIL_ERRORS, EMAIL_SUCCESS
from src.email.models.email_message import EmailMessage
from src.email.serializers.email_serializer import (
    EmailMessageCreateSerializer,
    EmailMessageSerializer
)
from src.email.services.email_service import EmailService
from src.user.access_control import email_permission, PermissionRequiredMixin


class EmailMessageViewSet(PermissionRequiredMixin, viewsets.ModelViewSet):
    
    queryset = EmailMessage.objects.all()
    pagination_class = StandardLimitPagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'source']
    search_fields = ['name', 'email', 'subject', 'message', 'phone']
    ordering_fields = ['created_at', 'updated_at', 'status']
    ordering = ['-created_at']
    
    permission_map = {
        'list': 'email.read',
        'retrieve': 'email.read',
        'update': 'email.update',
        'partial_update': 'email.update',
        'destroy': 'email.delete',
        'mark_as_read': 'email.update',
        'mark_as_replied': 'email.update',
        'stats': 'email.read',
        'save_as_draft': 'email.update',
    }
    permission_denied_message = EMAIL_ERRORS["message_not_authorized"]
    
    def list(self, request, *args, **kwargs):
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
        if self.action == 'create':
            return [AllowAny()]
        return [email_permission()]  # ✅ instantiate می‌کند
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, context={'request': request})
        
        if not serializer.is_valid():
            return APIResponse.error(
                message=EMAIL_ERRORS['validation_error'],
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            instance = EmailService.create_email_message(
                validated_data=serializer.validated_data,
                request=request,
                initial_data=serializer.initial_data
            )
            response_serializer = EmailMessageSerializer(instance)
            
            return APIResponse.success(
                message=EMAIL_SUCCESS['message_sent'],
                data=response_serializer.data,
                status_code=status.HTTP_201_CREATED
            )
        except Exception:
            return APIResponse.error(
                message=EMAIL_ERRORS['message_create_failed'],
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def retrieve(self, request, *args, **kwargs):
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
        except Exception:
            return APIResponse.error(
                message=EMAIL_ERRORS['message_update_failed'],
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def destroy(self, request, *args, **kwargs):
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
        except Exception:
            return APIResponse.error(
                message=EMAIL_ERRORS['message_delete_failed'],
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'], permission_classes=[email_permission])
    def mark_as_read(self, request, pk=None):
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
    
    @action(detail=True, methods=['post'], permission_classes=[email_permission])
    def mark_as_replied(self, request, pk=None):
        try:
            message = self.get_object()
            reply_text = request.data.get('reply_message', '')
            
            if not reply_text:
                return APIResponse.error(
                    message=EMAIL_ERRORS['reply_text_required'],
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            
            email_sent = EmailService.send_reply_email(message, reply_text, request.user)
            
            if not email_sent:
                return APIResponse.error(
                    message=EMAIL_ERRORS['email_send_failed'],
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
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
    
    @action(detail=False, methods=['get'], permission_classes=[email_permission])
    def stats(self, request):
        try:
            stats = EmailService.get_statistics()
            stats['draft'] = EmailMessage.objects.filter(status='draft').count()
            
            return APIResponse.success(
                message=EMAIL_SUCCESS['statistics_retrieved'],
                data=stats,
                status_code=status.HTTP_200_OK
            )
        except Exception:
            return APIResponse.error(
                message=EMAIL_ERRORS['message_not_found'],
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'], permission_classes=[email_permission])
    def save_as_draft(self, request, pk=None):
        try:
            message = self.get_object()
            message.save_as_draft(request.user)
            serializer = self.get_serializer(message)
            
            return APIResponse.success(
                message=EMAIL_SUCCESS['draft_saved'],
                data=serializer.data,
                status_code=status.HTTP_200_OK
            )
        except EmailMessage.DoesNotExist:
            return APIResponse.error(
                message=EMAIL_ERRORS['message_not_found'],
                status_code=status.HTTP_404_NOT_FOUND
            )

