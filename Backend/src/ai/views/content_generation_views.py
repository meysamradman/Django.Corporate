from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated

from src.core.responses.response import APIResponse
from src.ai.services.content_generation_service import AIContentGenerationService
from src.ai.serializers.content_generation_serializer import (
    AIContentGenerationRequestSerializer,
    AIContentGenerationResponseSerializer
)
from src.ai.messages.messages import AI_SUCCESS, AI_ERRORS
from src.user.access_control import PermissionValidator
from src.ai.providers.capabilities import get_provider_capabilities, supports_feature, PROVIDER_CAPABILITIES
from src.ai.providers.openrouter import OpenRouterProvider, OpenRouterModelCache
from src.ai.providers.groq import GroqProvider
from src.ai.providers.huggingface import HuggingFaceProvider
from src.ai.models import AIProvider, AdminProviderSettings
from src.ai.utils.destination_handler import ContentDestinationHandler


class AIContentGenerationViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'], url_path='capabilities')
    def get_capabilities(self, request):
        provider_name = request.query_params.get('provider_name')
        
        if provider_name:
            caps = get_provider_capabilities(provider_name)
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
        has_content_permission = PermissionValidator.has_permission(request.user, 'ai.content.manage')
        has_manage_permission = PermissionValidator.has_permission(request.user, 'ai.manage')
        has_permission = has_content_permission or has_manage_permission
        
        if not has_permission:
            return APIResponse.error(
                message=AI_ERRORS["content_not_authorized"],
                status_code=status.HTTP_403_FORBIDDEN
            )
        try:
            # استفاده از ProviderAvailabilityManager که مدل‌های فعال را هم چک می‌کند
            from src.ai.providers.capabilities import ProviderAvailabilityManager
            providers = ProviderAvailabilityManager.get_available_providers('content', include_api_based=True)
            return APIResponse.success(
                message=AI_SUCCESS["providers_list_retrieved"],
                data=providers,
                status_code=status.HTTP_200_OK
            )
        except Exception as e:
            return APIResponse.error(
                message=AI_ERRORS["providers_list_error"].format(error=str(e)),
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'], url_path='openrouter-models')
    def openrouter_models(self, request):
        has_content_permission = PermissionValidator.has_permission(request.user, 'ai.content.manage')
        has_manage_permission = PermissionValidator.has_permission(request.user, 'ai.manage')
        has_permission = has_content_permission or has_manage_permission
        
        if not has_permission:
            return APIResponse.error(
                message=AI_ERRORS["openrouter_permission_denied"],
                status_code=status.HTTP_403_FORBIDDEN
            )
        
        try:
            try:
                provider = AIProvider.objects.get(slug='openrouter', is_active=True)
            except AIProvider.DoesNotExist:
                return APIResponse.error(
                    message=AI_ERRORS["openrouter_not_active"],
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            
            settings = AdminProviderSettings.objects.filter(
                admin=request.user,
                provider=provider,
                is_active=True
            ).select_related('provider').first()
            
            api_key = None
            
            if settings:
                try:
                    api_key = settings.get_api_key()
                except Exception:
                    if settings.use_shared_api:
                        personal_key = settings.get_personal_api_key()
                        if personal_key and personal_key.strip():
                            api_key = personal_key
            
            if not api_key or not api_key.strip():
                shared_key = provider.get_shared_api_key()
                if shared_key and shared_key.strip():
                    api_key = shared_key
            
            use_cache = request.query_params.get('use_cache', 'true').lower() != 'false'
            
            final_api_key = api_key if (api_key and api_key.strip()) else None
            models = OpenRouterProvider.get_available_models(
                api_key=final_api_key, 
                provider_filter=None,
                use_cache=use_cache
            )
            
            return APIResponse.success(
                message=AI_SUCCESS["openrouter_models_retrieved"].format(from_cache=""),
                data=models,
                status_code=status.HTTP_200_OK
            )
        except Exception as e:
            return APIResponse.error(
                message=AI_ERRORS["openrouter_models_error"].format(error=str(e)),
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'], url_path='groq-models')
    def groq_models(self, request):
        has_content_permission = PermissionValidator.has_permission(request.user, 'ai.content.manage')
        has_manage_permission = PermissionValidator.has_permission(request.user, 'ai.manage')
        has_permission = has_content_permission or has_manage_permission
        
        if not has_permission:
            return APIResponse.error(
                message=AI_ERRORS["groq_permission_denied"],
                status_code=status.HTTP_403_FORBIDDEN
            )
        
        try:
            try:
                provider = AIProvider.objects.get(slug='groq', is_active=True)
            except AIProvider.DoesNotExist:
                return APIResponse.error(
                    message=AI_ERRORS["groq_not_active"],
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            
            settings = AdminProviderSettings.objects.filter(
                admin=request.user,
                provider=provider,
                is_active=True
            ).select_related('provider').first()
            
            api_key = None
            
            if settings:
                try:
                    api_key = settings.get_api_key()
                except Exception:
                    if settings.use_shared_api:
                        personal_key = settings.get_personal_api_key()
                        if personal_key and personal_key.strip():
                            api_key = personal_key
            
            if not api_key or not api_key.strip():
                shared_key = provider.get_shared_api_key()
                if shared_key and shared_key.strip():
                    api_key = shared_key
            
            use_cache = request.query_params.get('use_cache', 'true').lower() != 'false'
            
            models = GroqProvider.get_available_models(
                api_key=api_key if (api_key and api_key.strip()) else None,
                use_cache=use_cache
            )
            
            return APIResponse.success(
                message=AI_SUCCESS["groq_models_retrieved"].format(from_cache=""),
                data=models,
                status_code=status.HTTP_200_OK
            )
        except Exception as e:
            return APIResponse.error(
                message=AI_ERRORS["groq_models_error"].format(error=str(e)),
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'], url_path='huggingface-models')
    def huggingface_models(self, request):
        has_content_permission = PermissionValidator.has_permission(request.user, 'ai.content.manage')
        has_manage_permission = PermissionValidator.has_permission(request.user, 'ai.manage')
        has_permission = has_content_permission or has_manage_permission
        
        if not has_permission:
            return APIResponse.error(
                message=AI_ERRORS["provider_not_authorized"],
                status_code=status.HTTP_403_FORBIDDEN
            )
        
        try:
            try:
                provider = AIProvider.objects.get(slug='huggingface', is_active=True)
            except AIProvider.DoesNotExist:
                return APIResponse.error(
                    message=AI_ERRORS["huggingface_not_active"],
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            
            settings = AdminProviderSettings.objects.filter(
                admin=request.user,
                provider=provider,
                is_active=True
            ).first()
            
            api_key = None
            
            if settings:
                try:
                    api_key = settings.get_api_key()
                except Exception:
                    if settings.use_shared_api:
                        personal_key = settings.get_personal_api_key()
                        if personal_key and personal_key.strip():
                            api_key = personal_key
                    else:
                        personal_key = settings.get_personal_api_key()
                        if personal_key and personal_key.strip():
                            api_key = personal_key
            
            if not api_key or not api_key.strip():
                shared_key = provider.get_shared_api_key()
                if shared_key and shared_key.strip():
                    api_key = shared_key
            
            use_cache = request.query_params.get('use_cache', 'true').lower() != 'false'
            task_filter = request.query_params.get('task', 'text-generation')  # برای content از text-generation استفاده می‌کنیم
            
            models = HuggingFaceProvider.get_available_models(
                api_key=api_key if (api_key and api_key.strip()) else None,
                task_filter=task_filter,
                use_cache=use_cache
            )
            
            return APIResponse.success(
                message=AI_SUCCESS["huggingface_models_retrieved"].format(from_cache=""),
                data=models,
                status_code=status.HTTP_200_OK
            )
        except Exception as e:
            return APIResponse.error(
                message=AI_ERRORS["huggingface_models_error"].format(error=str(e)),
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'], url_path='clear-openrouter-cache')
    def clear_openrouter_cache(self, request):
        if not PermissionValidator.has_permission(request.user, 'ai.manage'):
            return APIResponse.error(
                message=AI_ERRORS["cache_clear_permission_denied"],
                status_code=status.HTTP_403_FORBIDDEN
            )
        
        try:
            OpenRouterModelCache.clear_all()
            message = AI_SUCCESS["cache_cleared"]
            
            return APIResponse.success(
                message=message,
                status_code=status.HTTP_200_OK
            )
        except Exception as e:
            return APIResponse.error(
                message=AI_ERRORS["cache_clear_error"].format(error=str(e)),
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'], url_path='generate')
    def generate_content(self, request):
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
        
        destination = validated_data.get('destination', 'direct')
        destination_data = validated_data.get('destination_data', {})
        
        try:
            content_data = AIContentGenerationService.generate_content(
                topic=validated_data['topic'],
                provider_name=validated_data.get('provider_name', 'gemini'),
                word_count=validated_data.get('word_count', 500),
                tone=validated_data.get('tone', 'professional'),
                keywords=validated_data.get('keywords', []),
                admin=request.user,
            )
            
            try:
                destination_result = ContentDestinationHandler.save_to_destination(
                    content_data=content_data,
                    destination=destination,
                    destination_data=destination_data,
                    admin=request.user
                )
            except ValueError:
                return APIResponse.error(
                    message=AI_ERRORS["destination_invalid"],
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            
            response_data = {
                'content': content_data,
                'destination': destination_result,
            }
            
            if destination_result['saved']:
                message = AI_SUCCESS['content_generated_and_saved']
            else:
                message = AI_SUCCESS['content_generated']
            
            return APIResponse.success(
                message=message,
                data=response_data,
                status_code=status.HTTP_200_OK
            )
            
        except ValueError:
            return APIResponse.error(
                message=AI_ERRORS["validation_error"],
                status_code=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            error_message = str(e)
            if 'error' not in error_message.lower():
                error_message = AI_ERRORS["content_generation_failed"].format(error=error_message)
            return APIResponse.error(
                message=error_message,
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

