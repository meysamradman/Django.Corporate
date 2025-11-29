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
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['post'], url_path='send-message')
    def send_message(self, request):
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
                message=AI_ERRORS["chat_not_authorized"],
                status_code=status.HTTP_403_FORBIDDEN
            )
        
        serializer = AIChatRequestSerializer(data=request.data)
        
        if not serializer.is_valid():
            logger.warning(f"[AI Chat View] Validation errors: {serializer.errors}")
            print(f"[AI Chat View] Validation errors: {serializer.errors}")
            return APIResponse.error(
                message=AI_ERRORS["validation_error"],
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
                message=AI_SUCCESS["message_sent"],
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
            if 'error' not in error_message.lower() and 'خطا' not in error_message:
                error_message = AI_ERRORS["chat_failed"].format(error=error_message)
            return APIResponse.error(
                message=error_message,
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'], url_path='capabilities')
    def get_capabilities(self, request):
        import logging
        logger = logging.getLogger(__name__)
        
        provider_name = request.query_params.get('provider_name')
        
        if provider_name:
            # Get capabilities for specific provider
            caps = get_provider_capabilities(provider_name)
            # Check if provider supports chat
            if not supports_feature(provider_name, 'chat'):
                return APIResponse.error(
                    message=AI_ERRORS["provider_not_supported"].format(provider_name=provider_name),
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            return APIResponse.success(
                message=AI_SUCCESS["capabilities_retrieved"].format(provider_name=provider_name),
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
                message=AI_SUCCESS["all_capabilities_retrieved"],
                data=chat_providers,
                status_code=status.HTTP_200_OK
            )
    
    @action(detail=False, methods=['get'], url_path='available-providers')
    def available_providers(self, request):
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
                message=AI_ERRORS["chat_not_authorized"],
                status_code=status.HTTP_403_FORBIDDEN
            )
        try:
            logger.info("[AI Chat View] Getting available providers...")
            print("[AI Chat View] Getting available providers...")
            providers = AIChatService.get_available_providers(admin=request.user)
            logger.info(f"[AI Chat View] Found {len(providers)} providers: {providers}")
            print(f"[AI Chat View] Found {len(providers)} providers: {providers}")
            return APIResponse.success(
                message=AI_SUCCESS["providers_list_retrieved"],
                data=providers,
                status_code=status.HTTP_200_OK
            )
        except Exception as e:
            logger.error(f"[AI Chat View] Error: {str(e)}", exc_info=True)
            return APIResponse.error(
                message=AI_ERRORS["providers_list_error"].format(error=str(e)),
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'], url_path='openrouter-models')
    def openrouter_models(self, request):
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
                message=AI_ERRORS["openrouter_permission_denied"],
                status_code=status.HTTP_403_FORBIDDEN
            )
        
        try:
            from src.ai.providers.openrouter import OpenRouterProvider
            from src.ai.models import AIProvider, AdminProviderSettings
            
            # Get API key for OpenRouter
            try:
                provider = AIProvider.objects.get(slug='openrouter', is_active=True)
            except AIProvider.DoesNotExist:
                return APIResponse.error(
                    message=AI_ERRORS["openrouter_not_active"],
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            
            # Optimized: Simple and clear logic for getting API key
            # Optimized: Using select_related to prevent N+1 queries
            settings = AdminProviderSettings.objects.filter(
                admin=request.user,
                provider=provider,
                is_active=True
            ).select_related('provider').first()
            
            api_key = None
            
            # Strategy 1: If settings exist
            if settings:
                # First try to get from get_api_key() (based on use_shared_api)
                try:
                    api_key = settings.get_api_key()
                    logger.info(f"[AI Chat API] Using API key from settings (use_shared_api={settings.use_shared_api})")
                except Exception as e:
                    logger.warning(f"[AI Chat API] get_api_key() failed: {e}")
                    # If use_shared_api=True but shared key is not set, check personal
                    if settings.use_shared_api:
                        # Shared API key not set, try personal
                        personal_key = settings.get_personal_api_key()
                        if personal_key and personal_key.strip():
                            api_key = personal_key
                            logger.info(f"[AI Chat API] Fallback: Using personal API key")
                        else:
                            logger.warning(f"[AI Chat API] Personal API key also empty")
                    else:
                        # use_shared_api=False but personal is also not set
                        logger.warning(f"[AI Chat API] Personal API key not set")
            
            # Strategy 2: If still no API key, check shared provider
            if not api_key or not api_key.strip():
                shared_key = provider.get_shared_api_key()
                if shared_key and shared_key.strip():
                    api_key = shared_key
                    logger.info(f"[AI Chat API] Using shared provider API key")
                else:
                    logger.warning(f"[AI Chat API] Shared provider API key also empty")
            
            # Get query params
            provider_filter = request.query_params.get('provider', None)  # e.g., 'google', 'openai'
            use_cache = request.query_params.get('use_cache', 'true').lower() != 'false'
            
            models = OpenRouterProvider.get_available_models(
                api_key=api_key if (api_key and api_key.strip()) else None, 
                provider_filter=provider_filter,
                use_cache=use_cache
            )
            
            logger.info(f"[AI Chat View] Found {len(models)} OpenRouter models (cache: {use_cache})")
            print(f"[AI Chat View] Found {len(models)} OpenRouter models (cache: {use_cache})")
            
            cache_text = " (از کش)" if use_cache else " (تازه)"
            return APIResponse.success(
                message=AI_SUCCESS["openrouter_models_retrieved"].format(from_cache=cache_text),
                data=models,
                status_code=status.HTTP_200_OK
            )
        except Exception as e:
            logger.error(f"[AI Chat View] Error getting OpenRouter models: {str(e)}", exc_info=True)
            print(f"[AI Chat View] Error getting OpenRouter models: {str(e)}")
            return APIResponse.error(
                message=AI_ERRORS["openrouter_models_error"].format(error=str(e)),
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'], url_path='groq-models')
    def groq_models(self, request):
        import logging
        logger = logging.getLogger(__name__)
        
        logger.info(f"[AI Chat View] groq_models called by user: {request.user}")
        print(f"[AI Chat View] groq_models called by user: {request.user}")
        
        # Check permission
        has_chat_permission = PermissionValidator.has_permission(request.user, 'ai.chat.manage')
        has_manage_permission = PermissionValidator.has_permission(request.user, 'ai.manage')
        has_permission = has_chat_permission or has_manage_permission
        
        if not has_permission:
            return APIResponse.error(
                message=AI_ERRORS["groq_permission_denied"],
                status_code=status.HTTP_403_FORBIDDEN
            )
        
        try:
            from src.ai.providers.groq import GroqProvider
            from src.ai.models import AIProvider, AdminProviderSettings
            
            # Get API key for Groq
            try:
                provider = AIProvider.objects.get(slug='groq', is_active=True)
            except AIProvider.DoesNotExist:
                return APIResponse.error(
                    message=AI_ERRORS["groq_not_active"],
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            
            # Get API key (personal or shared)
            settings = AdminProviderSettings.objects.filter(
                admin=request.user,
                provider=provider,
                is_active=True
            ).select_related('provider').first()
            
            api_key = None
            
            if settings:
                try:
                    api_key = settings.get_api_key()
                    logger.info(f"[AI Chat API] Using API key from settings (use_shared_api={settings.use_shared_api})")
                except Exception as e:
                    logger.warning(f"[AI Chat API] get_api_key() failed: {e}")
                    if settings.use_shared_api:
                        personal_key = settings.get_personal_api_key()
                        if personal_key and personal_key.strip():
                            api_key = personal_key
                            logger.info(f"[AI Chat API] Fallback: Using personal API key")
            
            if not api_key or not api_key.strip():
                shared_key = provider.get_shared_api_key()
                if shared_key and shared_key.strip():
                    api_key = shared_key
                    logger.info(f"[AI Chat API] Using shared provider API key")
            
            # Get query params
            use_cache = request.query_params.get('use_cache', 'true').lower() != 'false'
            
            # Dynamic: Always get from Groq API (even without API key)
            models = GroqProvider.get_available_models(
                api_key=api_key if (api_key and api_key.strip()) else None,
                use_cache=use_cache
            )
            
            logger.info(f"[AI Chat View] Found {len(models)} Groq models (cache: {use_cache})")
            print(f"[AI Chat View] Found {len(models)} Groq models (cache: {use_cache})")
            
            cache_text = " (از کش)" if use_cache else " (تازه)"
            return APIResponse.success(
                message=AI_SUCCESS["groq_models_retrieved"].format(from_cache=cache_text),
                data=models,
                status_code=status.HTTP_200_OK
            )
        except Exception as e:
            logger.error(f"[AI Chat View] Error getting Groq models: {str(e)}", exc_info=True)
            print(f"[AI Chat View] Error getting Groq models: {str(e)}")
            return APIResponse.error(
                message=AI_ERRORS["groq_models_error"].format(error=str(e)),
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'], url_path='clear-openrouter-cache')
    def clear_openrouter_cache(self, request):
        import logging
        logger = logging.getLogger(__name__)
        
        # Check permission - only those who have ai.manage (usually super admins)
        if not PermissionValidator.has_permission(request.user, 'ai.manage'):
            return APIResponse.error(
                message=AI_ERRORS["cache_clear_permission_denied"],
                status_code=status.HTTP_403_FORBIDDEN
            )
        
        try:
            from src.ai.providers.openrouter import OpenRouterModelCache
            
            # Get provider filter from request (optional)
            provider_filter = request.data.get('provider', None)
            
            if provider_filter:
                OpenRouterModelCache.clear_provider(provider_filter)
                message = AI_SUCCESS["provider_cache_cleared"].format(provider=provider_filter)
            else:
                OpenRouterModelCache.clear_all()
                message = AI_SUCCESS["cache_cleared"]
            
            logger.info(f"[AI Chat View] {message}")
            print(f"[AI Chat View] {message}")
            
            return APIResponse.success(
                message=message,
                status_code=status.HTTP_200_OK
            )
        except Exception as e:
            logger.error(f"[AI Chat View] Error clearing cache: {str(e)}", exc_info=True)
            return APIResponse.error(
                message=AI_ERRORS["cache_clear_error"].format(error=str(e)),
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

