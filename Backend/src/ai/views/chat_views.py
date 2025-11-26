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
from src.ai.providers.capabilities import get_provider_capabilities, supports_feature


class AIChatViewSet(viewsets.ViewSet):
    """
    ViewSet for AI Chat - Simple chat without database storage
    """
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['post'], url_path='send-message')
    def send_message(self, request):
        """Send a chat message and get AI response"""
        import logging
        logger = logging.getLogger(__name__)
        
        logger.info(f"[AI Chat View] send_message called by user: {request.user}")
        print(f"[AI Chat View] send_message called by user: {request.user}")
        print(f"[AI Chat View] Request data: {request.data}")
        
        # Check permission with fallback - allow ai.manage or ai.chat.manage
        has_chat_permission = PermissionValidator.has_permission(request.user, 'ai.chat.manage')
        has_manage_permission = PermissionValidator.has_permission(request.user, 'ai.manage')
        has_permission = has_chat_permission or has_manage_permission
        
        logger.info(f"[AI Chat View] Permission check: ai.chat.manage={has_chat_permission}, ai.manage={has_manage_permission}")
        print(f"[AI Chat View] Permission check: ai.chat.manage={has_chat_permission}, ai.manage={has_manage_permission}")
        
        if not has_permission:
            logger.warning(f"[AI Chat View] Permission denied for user: {request.user}")
            print(f"[AI Chat View] Permission denied for user: {request.user}")
            return APIResponse.error(
                message=AI_ERRORS.get("chat_not_authorized", "You don't have permission to use AI chat"),
                status_code=status.HTTP_403_FORBIDDEN
            )
        
        serializer = AIChatRequestSerializer(data=request.data)
        
        if not serializer.is_valid():
            logger.warning(f"[AI Chat View] Validation errors: {serializer.errors}")
            print(f"[AI Chat View] Validation errors: {serializer.errors}")
            return APIResponse.error(
                message="خطا در اعتبارسنجی داده‌ها",
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        validated_data = serializer.validated_data
        
        logger.info(f"[AI Chat View] Validated data: {validated_data}")
        print(f"[AI Chat View] Validated data: {validated_data}")
        
        try:
            # Convert conversation_history to list of dicts if provided
            conversation_history = None
            if validated_data.get('conversation_history'):
                conversation_history = [
                    {'role': msg['role'], 'content': msg['content']}
                    for msg in validated_data['conversation_history']
                ]
            
            provider_name = validated_data.get('provider_name', 'gemini')
            logger.info(f"[AI Chat View] Calling AIChatService.chat with provider: {provider_name}")
            print(f"[AI Chat View] Calling AIChatService.chat with provider: {provider_name}")
            
            # Send message and get response
            # Model will be read from config in get_provider method
            chat_data = AIChatService.chat(
                message=validated_data['message'],
                provider_name=provider_name,
                conversation_history=conversation_history,
                system_message=validated_data.get('system_message'),
                temperature=validated_data.get('temperature', 0.7),
                max_tokens=validated_data.get('max_tokens', 2048),
                admin=request.user,  # ✅ Pass admin for personal/shared API selection
            )
            
            logger.info(f"[AI Chat View] Chat response received successfully")
            print(f"[AI Chat View] Chat response received successfully")
            
            # Format response
            response_serializer = AIChatResponseSerializer(chat_data)
            
            return APIResponse.success(
                message="پیام با موفقیت ارسال شد و پاسخ دریافت شد.",
                data=response_serializer.data,
                status_code=status.HTTP_200_OK
            )
            
        except ValueError as e:
            logger.error(f"[AI Chat View] ValueError: {str(e)}", exc_info=True)
            print(f"[AI Chat View] ValueError: {str(e)}")
            return APIResponse.error(
                message=str(e),
                status_code=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            error_message = str(e)
            logger.error(f"[AI Chat View] Exception: {error_message}", exc_info=True)
            print(f"[AI Chat View] Exception: {error_message}")
            import traceback
            print(f"[AI Chat View] Traceback: {traceback.format_exc()}")
            if 'خطا' not in error_message:
                error_message = f"خطا در چت: {error_message}"
            return APIResponse.error(
                message=error_message,
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'], url_path='capabilities')
    def get_capabilities(self, request):
        """
        Get capabilities for all providers or a specific provider for Chat
        
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
            # Check if provider supports chat
            if not supports_feature(provider_name, 'chat'):
                return APIResponse.error(
                    message=f"{provider_name} از قابلیت Chat پشتیبانی نمی‌کند",
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            return APIResponse.success(
                message=f"قابلیت‌های Chat برای {provider_name} دریافت شد",
                data=caps,
                status_code=status.HTTP_200_OK
            )
        else:
            # Get all capabilities for providers that support chat
            from src.ai.providers.capabilities import PROVIDER_CAPABILITIES
            chat_providers = {
                name: caps for name, caps in PROVIDER_CAPABILITIES.items()
                if caps.get('supports_chat', False)
            }
            return APIResponse.success(
                message="قابلیت‌های Chat تمام Provider ها دریافت شد",
                data=chat_providers,
                status_code=status.HTTP_200_OK
            )
    
    @action(detail=False, methods=['get'], url_path='available-providers')
    def available_providers(self, request):
        """Get list of available chat providers"""
        import logging
        logger = logging.getLogger(__name__)
        
        logger.info(f"[AI Chat View] available_providers called by user: {request.user}")
        print(f"[AI Chat View] available_providers called by user: {request.user}")
        
        # Check permission with fallback - allow ai.manage or ai.chat.manage
        has_chat_permission = PermissionValidator.has_permission(request.user, 'ai.chat.manage')
        has_manage_permission = PermissionValidator.has_permission(request.user, 'ai.manage')
        has_permission = has_chat_permission or has_manage_permission
        
        logger.info(f"[AI Chat View] Permission check: ai.chat.manage={has_chat_permission}, ai.manage={has_manage_permission}")
        print(f"[AI Chat View] Permission check: ai.chat.manage={has_chat_permission}, ai.manage={has_manage_permission}")
        
        if not has_permission:
            logger.warning(f"[AI Chat View] Permission denied for user: {request.user}")
            print(f"[AI Chat View] Permission denied for user: {request.user}")
            return APIResponse.error(
                message=AI_ERRORS.get("chat_not_authorized", "You don't have permission to view AI chat providers"),
                status_code=status.HTTP_403_FORBIDDEN
            )
        try:
            logger.info("[AI Chat View] Getting available providers...")
            print("[AI Chat View] Getting available providers...")
            providers = AIChatService.get_available_providers(admin=request.user)
            logger.info(f"[AI Chat View] Found {len(providers)} providers: {providers}")
            print(f"[AI Chat View] Found {len(providers)} providers: {providers}")
            return APIResponse.success(
                message="لیست Provider های فعال دریافت شد.",
                data=providers,
                status_code=status.HTTP_200_OK
            )
        except Exception as e:
            logger.error(f"[AI Chat View] Error: {str(e)}", exc_info=True)
            return APIResponse.error(
                message=f"خطا در دریافت لیست Provider ها: {str(e)}",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'], url_path='openrouter-models')
    def openrouter_models(self, request):
        """
        Get list of available OpenRouter models
        
        Query params:
            - provider: Filter by provider (e.g., 'google', 'openai', 'anthropic')
            - use_cache: Whether to use cache (default: true)
        
        Cache:
            - Cached for 6 hours
            - Use ?use_cache=false to force fresh data
        """
        import logging
        logger = logging.getLogger(__name__)
        
        logger.info(f"[AI Chat View] openrouter_models called by user: {request.user}")
        print(f"[AI Chat View] openrouter_models called by user: {request.user}")
        
        # Check permission
        has_chat_permission = PermissionValidator.has_permission(request.user, 'ai.chat.manage')
        has_manage_permission = PermissionValidator.has_permission(request.user, 'ai.manage')
        has_permission = has_chat_permission or has_manage_permission
        
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
            provider_filter = request.query_params.get('provider', None)  # e.g., 'google', 'openai'
            use_cache = request.query_params.get('use_cache', 'true').lower() != 'false'
            
            # Get available models from OpenRouter (with cache)
            models = OpenRouterProvider.get_available_models(
                api_key, 
                provider_filter=provider_filter,
                use_cache=use_cache
            )
            
            logger.info(f"[AI Chat View] Found {len(models)} OpenRouter models (cache: {use_cache})")
            print(f"[AI Chat View] Found {len(models)} OpenRouter models (cache: {use_cache})")
            
            return APIResponse.success(
                message="لیست مدل‌های OpenRouter دریافت شد" + (" (از کش)" if use_cache else " (تازه)"),
                data=models,
                status_code=status.HTTP_200_OK
            )
        except Exception as e:
            logger.error(f"[AI Chat View] Error getting OpenRouter models: {str(e)}", exc_info=True)
            print(f"[AI Chat View] Error getting OpenRouter models: {str(e)}")
            return APIResponse.error(
                message=f"خطا در دریافت لیست مدل‌های OpenRouter: {str(e)}",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'], url_path='clear-openrouter-cache')
    def clear_openrouter_cache(self, request):
        """
        Clear OpenRouter models cache (Super Admin only via permission check)
        
        Use this when:
            - OpenRouter adds new models
            - You want to force refresh the models list
        
        Permission: ai.manage (فقط برای کسانی که دسترسی مدیریت AI دارند)
        """
        import logging
        logger = logging.getLogger(__name__)
        
        # Check permission - فقط کسانی که ai.manage دارند (معمولاً super admin ها)
        if not PermissionValidator.has_permission(request.user, 'ai.manage'):
            return APIResponse.error(
                message="شما دسترسی لازم برای پاک کردن کش مدل‌ها را ندارید",
                status_code=status.HTTP_403_FORBIDDEN
            )
        
        try:
            from src.ai.providers.openrouter import OpenRouterModelCache
            
            # Get provider filter from request (optional)
            provider_filter = request.data.get('provider', None)
            
            if provider_filter:
                # Clear specific provider cache
                OpenRouterModelCache.clear_provider(provider_filter)
                message = f"کش مدل‌های OpenRouter برای {provider_filter} پاک شد"
            else:
                # Clear all cache
                OpenRouterModelCache.clear_all()
                message = "کش تمام مدل‌های OpenRouter پاک شد"
            
            logger.info(f"[AI Chat View] {message}")
            print(f"[AI Chat View] {message}")
            
            return APIResponse.success(
                message=message,
                status_code=status.HTTP_200_OK
            )
        except Exception as e:
            logger.error(f"[AI Chat View] Error clearing cache: {str(e)}", exc_info=True)
            return APIResponse.error(
                message=f"خطا در پاک کردن کش: {str(e)}",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

