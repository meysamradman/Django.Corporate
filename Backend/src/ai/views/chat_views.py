from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated

from src.core.responses.response import APIResponse
from src.ai.services.chat_service import AIChatService
from src.ai.serializers.chat_serializer import (
    AIChatRequestSerializer,
    AIChatResponseSerializer,
)
from src.ai.messages.messages import AI_SUCCESS, AI_ERRORS
from src.user.permissions import PermissionValidator


class AIChatViewSet(viewsets.ViewSet):
    """
    ViewSet for AI Chat - Simple chat without database storage
    """
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['post'], url_path='send-message')
    def send_message(self, request):
        """Send a chat message and get AI response"""
        if not PermissionValidator.has_permission(request.user, 'ai.chat.manage'):
            return APIResponse.error(
                message=AI_ERRORS.get("chat_not_authorized", "You don't have permission to use AI chat"),
                status_code=status.HTTP_403_FORBIDDEN
            )
        serializer = AIChatRequestSerializer(data=request.data)
        
        if not serializer.is_valid():
            return APIResponse.error(
                message="خطا در اعتبارسنجی داده‌ها",
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        validated_data = serializer.validated_data
        
        try:
            # Convert conversation_history to list of dicts if provided
            conversation_history = None
            if validated_data.get('conversation_history'):
                conversation_history = [
                    {'role': msg['role'], 'content': msg['content']}
                    for msg in validated_data['conversation_history']
                ]
            
            # Send message and get response
            chat_data = AIChatService.chat(
                message=validated_data['message'],
                provider_name=validated_data.get('provider_name', 'gemini'),
                conversation_history=conversation_history,
                system_message=validated_data.get('system_message'),
                temperature=validated_data.get('temperature', 0.7),
                max_tokens=validated_data.get('max_tokens', 2048),
            )
            
            # Format response
            response_serializer = AIChatResponseSerializer(chat_data)
            
            return APIResponse.success(
                message="پیام با موفقیت ارسال شد و پاسخ دریافت شد.",
                data=response_serializer.data,
                status_code=status.HTTP_200_OK
            )
            
        except ValueError as e:
            return APIResponse.error(
                message=str(e),
                status_code=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            error_message = str(e)
            if 'خطا' not in error_message:
                error_message = f"خطا در چت: {error_message}"
            return APIResponse.error(
                message=error_message,
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'], url_path='available-providers')
    def available_providers(self, request):
        """Get list of available chat providers"""
        if not PermissionValidator.has_permission(request.user, 'ai.chat.manage'):
            return APIResponse.error(
                message=AI_ERRORS.get("chat_not_authorized", "You don't have permission to view AI chat providers"),
                status_code=status.HTTP_403_FORBIDDEN
            )
        try:
            providers = AIChatService.get_available_providers()
            return APIResponse.success(
                message="لیست Provider های فعال دریافت شد.",
                data=providers,
                status_code=status.HTTP_200_OK
            )
        except Exception as e:
            return APIResponse.error(
                message=f"خطا در دریافت لیست Provider ها: {str(e)}",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

