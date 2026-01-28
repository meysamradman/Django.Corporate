from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated

from src.core.responses.response import APIResponse
from src.ai.services.content_generation_service import AIContentGenerationService
from src.ai.serializers.content_generation_serializer import (
    AIContentGenerationRequestSerializer,
    AIContentGenerationResponseSerializer
)
from src.ai.destinations.registry import ContentDestinationRegistry
from src.ai.messages.messages import AI_SUCCESS, AI_ERRORS
from src.user.access_control import ai_permission, PermissionRequiredMixin
from src.ai.providers.capabilities import get_provider_capabilities, supports_feature, PROVIDER_CAPABILITIES
from src.ai.providers.openrouter import OpenRouterProvider, OpenRouterModelCache
from src.ai.providers.groq import GroqProvider
from src.ai.providers.huggingface import HuggingFaceProvider
from src.ai.models import AIProvider, AdminProviderSettings
from src.ai.utils.destination_handler import ContentDestinationHandler

class AIContentGenerationViewSet(PermissionRequiredMixin, viewsets.ViewSet):
    permission_classes = [ai_permission]
    
    permission_map = {
        'available_providers': ['ai.content.manage', 'ai.manage'],  # Check if user has ai.content.manage OR ai.manage
        'openrouter_models': ['ai.content.manage', 'ai.manage'],
        'groq_models': ['ai.content.manage', 'ai.manage'],
        'huggingface_models': ['ai.content.manage', 'ai.manage'],
        'clear_openrouter_cache': ['ai.content.manage', 'ai.manage'],
        'generate_content': ['ai.content.manage', 'ai.manage'],
    }
    permission_denied_message = AI_ERRORS["content_not_authorized"]
    
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
            
    @action(detail=False, methods=['get'])
    def destinations(self, request):
        
        destinations = ContentDestinationRegistry.get_all_destinations()
        return APIResponse.success(
            message='لیست مقاصد دریافت شد',
            data=destinations,
            status_code=status.HTTP_200_OK
        )
    
    @action(detail=False, methods=['get'], url_path='available-providers')
    def available_providers(self, request):
        is_super = getattr(request.user, 'is_superuser', False) or getattr(request.user, 'is_admin_full', False)
        
        try:
            providers_qs = AIProvider.objects.filter(is_active=True).order_by('sort_order', 'display_name')
            
            result = []
            for provider in providers_qs:
                has_access = self._check_provider_access(request.user, provider, is_super)
                
                provider_info = {
                    'id': provider.id,
                    'slug': provider.slug,
                    'name': provider.display_name,
                    'description': provider.description,
                    'has_access': has_access,
                }
                result.append(provider_info)
            
            return APIResponse.success(
                message=AI_SUCCESS["providers_list_retrieved"],
                data=result,
                status_code=status.HTTP_200_OK
            )
        except Exception as e:
            return APIResponse.error(
                message=AI_ERRORS["providers_list_error"].format(error=str(e)),
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def _check_provider_access(self, user, provider, is_super: bool) -> bool:
        if is_super and provider.shared_api_key:
            return True
        
        personal_settings = AdminProviderSettings.objects.filter(
            admin=user,
            provider=provider,
            is_active=True,
            personal_api_key__isnull=False
        ).exclude(personal_api_key='').first()
        
        if personal_settings:
            return True
        
        if provider.allow_shared_for_normal_admins and provider.shared_api_key:
            return True
        
        return False
    
    @action(detail=False, methods=['get'], url_path='openrouter-models')
    def openrouter_models(self, request):
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

