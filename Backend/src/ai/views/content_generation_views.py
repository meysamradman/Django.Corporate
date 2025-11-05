from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils.translation import gettext_lazy as _

from src.core.responses.response import APIResponse
from src.ai.services.content_generation_service import AIContentGenerationService
from src.ai.serializers.content_generation_serializer import (
    AIContentGenerationRequestSerializer,
    AIContentGenerationResponseSerializer
)
from src.ai.messages.messages import AI_SUCCESS, AI_ERRORS


class AIContentGenerationViewSet(viewsets.ViewSet):
    """
    ViewSet for AI Content Generation
    """
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'], url_path='available-providers')
    def available_providers(self, request):
        """Get list of available content generation providers"""
        try:
            providers = AIContentGenerationService.get_available_providers()
            return APIResponse.success(
                message=AI_SUCCESS["providers_list_retrieved"],
                data=providers,
                status_code=status.HTTP_200_OK
            )
        except Exception as e:
            return APIResponse.error(
                message=f"خطا در دریافت لیست Provider ها: {str(e)}",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'], url_path='generate')
    def generate_content(self, request):
        """Generate SEO-optimized content"""
        serializer = AIContentGenerationRequestSerializer(data=request.data)
        
        if not serializer.is_valid():
            return APIResponse.error(
                message="خطا در اعتبارسنجی داده‌ها",
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        validated_data = serializer.validated_data
        
        try:
            # Generate content
            content_data = AIContentGenerationService.generate_content(
                topic=validated_data['topic'],
                provider_name=validated_data.get('provider_name', 'gemini'),
                word_count=validated_data.get('word_count', 500),
                tone=validated_data.get('tone', 'professional'),
                keywords=validated_data.get('keywords', []),
            )
            
            # Format response
            response_serializer = AIContentGenerationResponseSerializer(content_data)
            
            message = AI_SUCCESS["content_generated"]
            
            return APIResponse.success(
                message=message,
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
                error_message = AI_ERRORS["content_generation_failed"].format(error=error_message)
            return APIResponse.error(
                message=error_message,
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

