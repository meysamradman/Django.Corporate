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
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'], url_path='capabilities')
    def get_capabilities(self, request):
        import logging
        logger = logging.getLogger(__name__)
        
        provider_name = request.query_params.get('provider_name')
        
        if provider_name:
            # Get capabilities for specific provider
            caps = get_provider_capabilities(provider_name)
            # Check if provider supports content generation
            if not supports_feature(provider_name, 'content'):
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
            # Get all capabilities for providers that support content generation
            from src.ai.providers.capabilities import PROVIDER_CAPABILITIES
            content_providers = {
                name: caps for name, caps in PROVIDER_CAPABILITIES.items()
                if caps.get('supports_content', False)
            }
            return APIResponse.success(
                message=AI_SUCCESS["all_capabilities_retrieved"],
                data=content_providers,
                status_code=status.HTTP_200_OK
            )
    
    @action(detail=False, methods=['get'], url_path='available-providers')
    def available_providers(self, request):
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
                message=AI_ERRORS["content_not_authorized"],
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
                message=AI_ERRORS["providers_list_error"].format(error=str(e)),
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'], url_path='openrouter-models')
    def openrouter_models(self, request):
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
                    logger.info(f"[AI Content API] Using API key from settings (use_shared_api={settings.use_shared_api})")
                except Exception as e:
                    logger.warning(f"[AI Content API] get_api_key() failed: {e}")
                    # If use_shared_api=True but shared key is not set, check personal
                    if settings.use_shared_api:
                        # Shared API key not set, try personal
                        personal_key = settings.get_personal_api_key()
                        if personal_key and personal_key.strip():
                            api_key = personal_key
                            logger.info(f"[AI Content API] Fallback: Using personal API key")
                        else:
                            logger.warning(f"[AI Content API] Personal API key also empty")
                    else:
                        # use_shared_api=False but personal is also not set
                        logger.warning(f"[AI Content API] Personal API key not set")
            
            # Strategy 2: If still no API key, check shared provider
            if not api_key or not api_key.strip():
                shared_key = provider.get_shared_api_key()
                if shared_key and shared_key.strip():
                    api_key = shared_key
                    logger.info(f"[AI Content API] Using shared provider API key")
                else:
                    logger.warning(f"[AI Content API] Shared provider API key also empty")
            
            # Get query params
            use_cache = request.query_params.get('use_cache', 'true').lower() != 'false'
            
            # Dynamic: Always get from OpenRouter API (even without API key)
            # OpenRouter API may return model list without auth
            final_api_key = api_key if (api_key and api_key.strip()) else None
            models = OpenRouterProvider.get_available_models(
                api_key=final_api_key, 
                provider_filter=None,  # Get all text generation models
                use_cache=use_cache
            )
            
            logger.info(f"[AI Content View] Found {len(models)} content generation models (cache: {use_cache})")
            print(f"[AI Content View] Found {len(models)} content generation models (cache: {use_cache})")
            
            return APIResponse.success(
                message=AI_SUCCESS["openrouter_models_retrieved"].format(from_cache=" (از کش)" if use_cache else " (تازه)"),
                data=models,
                status_code=status.HTTP_200_OK
            )
        except Exception as e:
            logger.error(f"[AI Content View] Error getting OpenRouter models: {str(e)}", exc_info=True)
            print(f"[AI Content View] Error getting OpenRouter models: {str(e)}")
            return APIResponse.error(
                message=AI_ERRORS["openrouter_models_error"].format(error=str(e)),
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'], url_path='groq-models')
    def groq_models(self, request):
        import logging
        logger = logging.getLogger(__name__)
        
        logger.info(f"[AI Content View] groq_models called by user: {request.user}")
        print(f"[AI Content View] groq_models called by user: {request.user}")
        
        # Check permission
        has_content_permission = PermissionValidator.has_permission(request.user, 'ai.content.manage')
        has_manage_permission = PermissionValidator.has_permission(request.user, 'ai.manage')
        has_permission = has_content_permission or has_manage_permission
        
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
                    logger.info(f"[AI Content API] Using API key from settings (use_shared_api={settings.use_shared_api})")
                except Exception as e:
                    logger.warning(f"[AI Content API] get_api_key() failed: {e}")
                    if settings.use_shared_api:
                        personal_key = settings.get_personal_api_key()
                        if personal_key and personal_key.strip():
                            api_key = personal_key
                            logger.info(f"[AI Content API] Fallback: Using personal API key")
            
            if not api_key or not api_key.strip():
                shared_key = provider.get_shared_api_key()
                if shared_key and shared_key.strip():
                    api_key = shared_key
                    logger.info(f"[AI Content API] Using shared provider API key")
            
            # Get query params
            use_cache = request.query_params.get('use_cache', 'true').lower() != 'false'
            
            # Dynamic: Always get from Groq API (even without API key)
            models = GroqProvider.get_available_models(
                api_key=api_key if (api_key and api_key.strip()) else None,
                use_cache=use_cache
            )
            
            logger.info(f"[AI Content View] Found {len(models)} Groq models (cache: {use_cache})")
            print(f"[AI Content View] Found {len(models)} Groq models (cache: {use_cache})")
            
            return APIResponse.success(
                message=AI_SUCCESS["groq_models_retrieved"].format(from_cache=" (از کش)" if use_cache else " (تازه)"),
                data=models,
                status_code=status.HTTP_200_OK
            )
        except Exception as e:
            logger.error(f"[AI Content View] Error getting Groq models: {str(e)}", exc_info=True)
            print(f"[AI Content View] Error getting Groq models: {str(e)}")
            return APIResponse.error(
                message=AI_ERRORS["groq_models_error"].format(error=str(e)),
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'], url_path='clear-openrouter-cache')
    def clear_openrouter_cache(self, request):
        import logging
        logger = logging.getLogger(__name__)
        
        # Check permission - only those who have ai.manage
        if not PermissionValidator.has_permission(request.user, 'ai.manage'):
            return APIResponse.error(
                message=AI_ERRORS["cache_clear_permission_denied"],
                status_code=status.HTTP_403_FORBIDDEN
            )
        
        try:
            from src.ai.providers.openrouter import OpenRouterModelCache
            
            # Clear all cache
            OpenRouterModelCache.clear_all()
            message = AI_SUCCESS["cache_cleared"]
            
            logger.info(f"[AI Content View] {message}")
            print(f"[AI Content View] {message}")
            
            return APIResponse.success(
                message=message,
                status_code=status.HTTP_200_OK
            )
        except Exception as e:
            logger.error(f"[AI Content View] Error clearing cache: {str(e)}", exc_info=True)
            return APIResponse.error(
                message=AI_ERRORS["cache_clear_error"].format(error=str(e)),
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'], url_path='generate')
    def generate_content(self, request):
        # Check permission with fallback - allow ai.manage or ai.content.manage
        has_content_permission = PermissionValidator.has_permission(request.user, 'ai.content.manage')
        has_manage_permission = PermissionValidator.has_permission(request.user, 'ai.manage')
        has_permission = has_content_permission or has_manage_permission
        
        if not has_permission:
            return APIResponse.error(
                message=AI_ERRORS["content_not_authorized"],
                status_code=status.HTTP_403_FORBIDDEN
            )
        serializer = AIContentGenerationRequestSerializer(data=request.data)
        
        if not serializer.is_valid():
            return APIResponse.error(
                message=AI_ERRORS["validation_error"],
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        validated_data = serializer.validated_data
        
        # ✅ Extract destination info
        destination = validated_data.get('destination', 'direct')
        destination_data = validated_data.get('destination_data', {})
        
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
            
            # ✅ Handle destination
            from src.ai.services.destination_handler import ContentDestinationHandler
            
            try:
                destination_result = ContentDestinationHandler.save_to_destination(
                    content_data=content_data,
                    destination=destination,
                    destination_data=destination_data,
                    admin=request.user
                )
            except ValueError as dest_error:
                # Error in saving
                return APIResponse.error(
                    message=str(dest_error),
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            
            # Organize response
            response_data = {
                'content': content_data,  # Generated content
                'destination': destination_result,  # Save result
            }
            
            # ✅ Success message based on destination
            if destination_result['saved']:
                message = f"{AI_SUCCESS['content_generated']} {destination_result['message']}"
            else:
                message = AI_SUCCESS['content_generated']
            
            return APIResponse.success(
                message=message,
                data=response_data,
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

