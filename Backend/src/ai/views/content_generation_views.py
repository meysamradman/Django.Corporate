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
from src.user.permissions import PermissionValidator
from src.ai.providers.capabilities import get_provider_capabilities, supports_feature


class AIContentGenerationViewSet(viewsets.ViewSet):
    """
    ViewSet for AI Content Generation
    """
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'], url_path='capabilities')
    def get_capabilities(self, request):
        """
        Get capabilities for all providers or a specific provider for Content Generation
        
        Query params:
            - provider_name: Optional - specific provider to check
        
        Returns:
            - All capabilities if no provider specified
            - Specific provider capabilities if provider_name is provided
        """
        import logging
        logger = logging.getLogger(__name__)
        
        provider_name = request.query_params.get('provider_name')
        
        if provider_name:
            # Get capabilities for specific provider
            caps = get_provider_capabilities(provider_name)
            # Check if provider supports content generation
            if not supports_feature(provider_name, 'content'):
                return APIResponse.error(
                    message=f"{provider_name} از قابلیت تولید محتوا پشتیبانی نمی‌کند",
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            return APIResponse.success(
                message=f"قابلیت‌های تولید محتوا برای {provider_name} دریافت شد",
                data=caps,
                status_code=status.HTTP_200_OK
            )
        else:
            # Get all capabilities for providers that support content generation
            from src.ai.providers.capabilities import PROVIDER_CAPABILITIES
            content_providers = {
                name: caps for name, caps in PROVIDER_CAPABILITIES.items()
                if caps.get('supports_content', False)
            }
            return APIResponse.success(
                message="قابلیت‌های تولید محتوا تمام Provider ها دریافت شد",
                data=content_providers,
                status_code=status.HTTP_200_OK
            )
    
    @action(detail=False, methods=['get'], url_path='available-providers')
    def available_providers(self, request):
        """Get list of available content generation providers"""
        import logging
        logger = logging.getLogger(__name__)
        
        logger.info(f"[AI Content View] available_providers called by user: {request.user}")
        print(f"[AI Content View] available_providers called by user: {request.user}")
        
        # Check permission with fallback - allow ai.manage or ai.content.manage
        has_content_permission = PermissionValidator.has_permission(request.user, 'ai.content.manage')
        has_manage_permission = PermissionValidator.has_permission(request.user, 'ai.manage')
        has_permission = has_content_permission or has_manage_permission
        
        logger.info(f"[AI Content View] Permission check: ai.content.manage={has_content_permission}, ai.manage={has_manage_permission}")
        print(f"[AI Content View] Permission check: ai.content.manage={has_content_permission}, ai.manage={has_manage_permission}")
        
        if not has_permission:
            logger.warning(f"[AI Content View] Permission denied for user: {request.user}")
            print(f"[AI Content View] Permission denied for user: {request.user}")
            return APIResponse.error(
                message=AI_ERRORS.get("content_not_authorized", "You don't have permission to view AI content providers"),
                status_code=status.HTTP_403_FORBIDDEN
            )
        try:
            logger.info("[AI Content View] Getting available providers...")
            print("[AI Content View] Getting available providers...")
            providers = AIContentGenerationService.get_available_providers(admin=request.user)
            logger.info(f"[AI Content View] Found {len(providers)} providers: {providers}")
            print(f"[AI Content View] Found {len(providers)} providers: {providers}")
            return APIResponse.success(
                message=AI_SUCCESS["providers_list_retrieved"],
                data=providers,
                status_code=status.HTTP_200_OK
            )
        except Exception as e:
            logger.error(f"[AI Content View] Error: {str(e)}", exc_info=True)
            return APIResponse.error(
                message=f"خطا در دریافت لیست Provider ها: {str(e)}",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'], url_path='openrouter-models')
    def openrouter_models(self, request):
        """
        Get list of available OpenRouter models for content generation
        
        Query params:
            - use_cache: Whether to use cache (default: true)
        
        Cache:
            - Cached for 6 hours
            - Use ?use_cache=false to force fresh data
        """
        import logging
        logger = logging.getLogger(__name__)
        
        logger.info(f"[AI Content View] openrouter_models called by user: {request.user}")
        print(f"[AI Content View] openrouter_models called by user: {request.user}")
        
        # Check permission
        has_content_permission = PermissionValidator.has_permission(request.user, 'ai.content.manage')
        has_manage_permission = PermissionValidator.has_permission(request.user, 'ai.manage')
        has_permission = has_content_permission or has_manage_permission
        
        if not has_permission:
            return APIResponse.error(
                message="شما دسترسی لازم برای مشاهده مدل‌های OpenRouter را ندارید",
                status_code=status.HTTP_403_FORBIDDEN
            )
        
        try:
            from src.ai.providers.openrouter import OpenRouterProvider
            from src.ai.models.admin_ai_settings import AdminAISettings
            from src.ai.models.image_generation import AIImageGeneration
            
            # Get API key for OpenRouter
            try:
                api_key = AdminAISettings.get_api_key_for_admin(request.user, 'openrouter')
            except:
                # Fallback to shared API key
                shared_provider = AIImageGeneration.get_active_provider('openrouter')
                if not shared_provider:
                    return APIResponse.error(
                        message="OpenRouter فعال نیست یا API Key تنظیم نشده است",
                        status_code=status.HTTP_400_BAD_REQUEST
                    )
                api_key = shared_provider.get_api_key()
            
            # Get query params
            use_cache = request.query_params.get('use_cache', 'true').lower() != 'false'
            
            # Get available models from OpenRouter (with cache)
            models = OpenRouterProvider.get_available_models(
                api_key, 
                provider_filter=None,  # Get all text generation models
                use_cache=use_cache
            )
            
            logger.info(f"[AI Content View] Found {len(models)} content generation models (cache: {use_cache})")
            print(f"[AI Content View] Found {len(models)} content generation models (cache: {use_cache})")
            
            return APIResponse.success(
                message="لیست مدل‌های تولید محتوا OpenRouter دریافت شد" + (" (از کش)" if use_cache else " (تازه)"),
                data=models,
                status_code=status.HTTP_200_OK
            )
        except Exception as e:
            logger.error(f"[AI Content View] Error getting OpenRouter models: {str(e)}", exc_info=True)
            print(f"[AI Content View] Error getting OpenRouter models: {str(e)}")
            return APIResponse.error(
                message=f"خطا در دریافت لیست مدل‌های OpenRouter: {str(e)}",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'], url_path='clear-openrouter-cache')
    def clear_openrouter_cache(self, request):
        """
        Clear OpenRouter models cache
        
        Permission: ai.manage (فقط برای کسانی که دسترسی مدیریت AI دارند)
        """
        import logging
        logger = logging.getLogger(__name__)
        
        # Check permission - فقط کسانی که ai.manage دارند
        if not PermissionValidator.has_permission(request.user, 'ai.manage'):
            return APIResponse.error(
                message="شما دسترسی لازم برای پاک کردن کش مدل‌ها را ندارید",
                status_code=status.HTTP_403_FORBIDDEN
            )
        
        try:
            from src.ai.providers.openrouter import OpenRouterModelCache
            
            # Clear all cache
            OpenRouterModelCache.clear_all()
            message = "کش تمام مدل‌های OpenRouter پاک شد"
            
            logger.info(f"[AI Content View] {message}")
            print(f"[AI Content View] {message}")
            
            return APIResponse.success(
                message=message,
                status_code=status.HTTP_200_OK
            )
        except Exception as e:
            logger.error(f"[AI Content View] Error clearing cache: {str(e)}", exc_info=True)
            return APIResponse.error(
                message=f"خطا در پاک کردن کش: {str(e)}",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'], url_path='generate')
    def generate_content(self, request):
        """Generate SEO-optimized content"""
        if not PermissionValidator.has_permission(request.user, 'ai.content.manage'):
            return APIResponse.error(
                message=AI_ERRORS.get("content_not_authorized", "You don't have permission to generate AI content"),
                status_code=status.HTTP_403_FORBIDDEN
            )
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
                admin=request.user,
            )
            
            message = AI_SUCCESS["content_generated"]
            
            return APIResponse.success(
                message=message,
                data=content_data,  # ✅ مستقیماً content_data رو برمیگردونیم
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

