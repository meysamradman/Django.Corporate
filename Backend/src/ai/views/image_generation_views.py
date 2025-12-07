from rest_framework import viewsets, status
from rest_framework.decorators import action
from django.db import transaction
import time
import base64

from src.ai.models import AIProvider, AIModel, AdminProviderSettings
from src.ai.utils.state_machine import ModelAccessState
from src.ai.services.image_generation_service import AIImageGenerationService
from src.ai.serializers.image_generation_serializer import (
    AIProviderSerializer,
    AIProviderListSerializer,
    AIImageGenerationRequestSerializer,
)
from src.ai.messages.messages import AI_SUCCESS, AI_ERRORS
from src.user.auth.admin_session_auth import CSRFExemptSessionAuthentication
from src.core.responses.response import APIResponse
from src.user.access_control import AiManagerAccess, SuperAdminOnly, PermissionValidator
from src.ai.providers.capabilities import PROVIDER_CAPABILITIES, get_provider_capabilities
from src.ai.providers.openrouter import OpenRouterProvider, OpenRouterModelCache
from src.ai.providers.huggingface import HuggingFaceProvider
from src.media.serializers.media_serializer import MediaAdminSerializer


class AIImageProviderViewSet(viewsets.ModelViewSet):
    authentication_classes = [CSRFExemptSessionAuthentication]
    permission_classes = [SuperAdminOnly]
    queryset = AIProvider.objects.all()
    serializer_class = AIProviderSerializer
    lookup_field = 'id'
    
    def get_queryset(self):
        return AIProvider.objects.all().order_by('sort_order', 'display_name')
    
    def get_serializer_class(self):
        if self.action == 'list':
            return AIProviderListSerializer
        return AIProviderSerializer
    
    def list(self, request, *args, **kwargs):
        is_super = getattr(request.user, 'is_superuser', False) or getattr(request.user, 'is_admin_full', False)
        if is_super:
            providers = self.get_queryset()
        else:
            providers = AIProvider.objects.filter(is_active=True).order_by('sort_order', 'display_name')
        
        serializer = self.get_serializer(providers, many=True)
        
        return APIResponse.success(
            message=AI_SUCCESS["providers_list_retrieved"],
            data=serializer.data
        )
    
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        return APIResponse.success(
            message=AI_SUCCESS["provider_updated"],
            data=serializer.data
        )
    
    def create(self, request, *args, **kwargs):
        slug = request.data.get('slug')
        if not slug:
            return APIResponse.error(
                message=AI_ERRORS["slug_required"],
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            provider = AIProvider.objects.get(slug=slug)
            serializer = self.get_serializer(provider, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            self.perform_update(serializer)
            return APIResponse.success(
                message=AI_SUCCESS["provider_updated"],
                data=serializer.data,
                status_code=status.HTTP_200_OK
            )
        except AIProvider.DoesNotExist:
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)
            return APIResponse.success(
                message=AI_SUCCESS["provider_created"],
                data=serializer.data,
                status_code=status.HTTP_201_CREATED
            )
    
    @action(detail=False, methods=['get'], url_path='capabilities')
    def get_capabilities(self, request):
        provider_slug = request.query_params.get('provider')
        
        if provider_slug:
            caps = get_provider_capabilities(provider_slug)
            return APIResponse.success(
                message=AI_SUCCESS["capabilities_retrieved"].format(provider_slug=provider_slug),
                data=caps
            )
        
        return APIResponse.success(
            message=AI_SUCCESS["all_capabilities_retrieved"],
            data=PROVIDER_CAPABILITIES
        )
    
    @action(detail=False, methods=['get'], url_path='available')
    def available_providers(self, request):
        if not PermissionValidator.has_permission(request.user, 'ai.manage'):
            return APIResponse.error(
                message=AI_ERRORS["provider_not_authorized"],
                status_code=status.HTTP_403_FORBIDDEN
            )
        
        providers = AIProvider.objects.filter(is_active=True)
        serializer = AIProviderListSerializer(providers, many=True)
        
        api_based_providers = ['openrouter', 'groq', 'huggingface']
        
        available = [
            p for p in serializer.data
            if p.get('slug') in api_based_providers or p.get('has_shared_api_key') or p.get('allow_personal_keys')
        ]
        
        return APIResponse.success(
            message=AI_SUCCESS["providers_list_retrieved"],
            data=available
        )
    
    @action(detail=False, methods=['get'], url_path='openrouter-models')
    def openrouter_models(self, request):
        if not PermissionValidator.has_permission(request.user, 'ai.manage'):
            return APIResponse.error(
                message=AI_ERRORS["provider_not_authorized"],
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
            
            image_models = [
                m for m in models
                if any(kw in m['id'].lower() for kw in ['dall-e', 'flux', 'stable', 'midjourney'])
            ]
            
            return APIResponse.success(
                message=AI_SUCCESS["openrouter_models_retrieved"].format(from_cache=""),
                data=image_models
            )
        except Exception as e:
            return APIResponse.error(
                message=AI_ERRORS["openrouter_models_error"].format(error=str(e)),
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'], url_path='huggingface-models')
    def huggingface_models(self, request):
        if not PermissionValidator.has_permission(request.user, 'ai.manage'):
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
            task_filter = request.query_params.get('task', None)
            
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
                message=AI_ERRORS["provider_not_authorized"],
                status_code=status.HTTP_403_FORBIDDEN
            )
        
        try:
            OpenRouterModelCache.clear_all()
            
            return APIResponse.success(
                message=AI_SUCCESS["cache_cleared"]
            )
        except Exception as e:
            return APIResponse.error(
                message=AI_ERRORS["cache_clear_error"].format(error=str(e)),
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'], url_path='activate')
    def activate_provider(self, request, pk=None, id=None):
        provider = self.get_object()
        
        if not provider.shared_api_key:
            return APIResponse.error(
                message=AI_ERRORS["api_key_required"],
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            is_valid = AIImageGenerationService.validate_provider_api_key(
                provider.slug,
                provider.get_shared_api_key()
            )
            
            if not is_valid:
                return APIResponse.error(
                    message=AI_ERRORS["api_key_invalid"],
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            
            provider.is_active = True
            provider.save(update_fields=['is_active', 'updated_at'])
            
            serializer = self.get_serializer(provider)
            return APIResponse.success(
                message=AI_SUCCESS["provider_activated"],
                data=serializer.data
            )
        except Exception as e:
            return APIResponse.error(
                message=AI_ERRORS["activation_failed"].format(error=str(e)),
                status_code=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'], url_path='deactivate')
    def deactivate_provider(self, request, pk=None, id=None):
        provider = self.get_object()
        provider.is_active = False
        provider.save(update_fields=['is_active', 'updated_at'])
        
        serializer = self.get_serializer(provider)
        return APIResponse.success(
            message=AI_SUCCESS["provider_deactivated"],
            data=serializer.data
        )
    
    @action(detail=True, methods=['post'], url_path='validate-api-key')
    def validate_api_key(self, request, pk=None):
        provider = self.get_object()
        
        if not provider.shared_api_key:
            return APIResponse.error(
                message=AI_ERRORS["api_key_not_provided"],
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            is_valid = AIImageGenerationService.validate_provider_api_key(
                provider.slug,
                provider.get_shared_api_key()
            )
            
            message = AI_SUCCESS["api_key_valid"] if is_valid else AI_ERRORS["api_key_invalid"]
            return APIResponse.success(
                message=message,
                data={'valid': is_valid}
            )
        except Exception as e:
            return APIResponse.error(
                message=AI_ERRORS["validation_error"].format(error=str(e)),
                status_code=status.HTTP_400_BAD_REQUEST
            )


class AIImageGenerationViewSet(viewsets.ViewSet):
    authentication_classes = [CSRFExemptSessionAuthentication]
    permission_classes = [AiManagerAccess]
    
    @action(detail=False, methods=['post'], url_path='generate')
    def generate_image(self, request):
        if not PermissionValidator.has_permission(request.user, 'ai.image.manage'):
            return APIResponse.error(
                message=AI_ERRORS["image_not_authorized"],
                status_code=status.HTTP_403_FORBIDDEN
            )
        
        serializer = AIImageGenerationRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return APIResponse.error(
                message=AI_ERRORS["prompt_invalid"],
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        data = serializer.validated_data
        model_id = data.get('model_id')
        save_to_db = data.get('save_to_media', True)
        
        try:
            model = AIModel.objects.select_related('provider').get(id=model_id)
            
            state = ModelAccessState.calculate(model.provider, model, request.user)
            if state not in [ModelAccessState.AVAILABLE_SHARED, ModelAccessState.AVAILABLE_PERSONAL]:
                return APIResponse.error(
                    message=AI_ERRORS["model_access_denied"],
                    status_code=status.HTTP_403_FORBIDDEN
                )
            
            if 'image' not in model.capabilities:
                return APIResponse.error(
                    message=AI_ERRORS["model_no_image_capability"],
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            
            start_time = time.time()
            
            if save_to_db:
                with transaction.atomic():
                    media = AIImageGenerationService.generate_and_save_to_media(
                        provider_name=model.provider.slug,
                        prompt=data.get('prompt'),
                        admin=request.user,
                        title=data.get('title', data.get('prompt')[:100]),
                        alt_text=data.get('alt_text', data.get('prompt')[:200]),
                        save_to_db=True,
                        size=data.get('size', '1024x1024'),
                        quality=data.get('quality', 'standard'),
                        style=data.get('style', 'vivid'),
                        n=data.get('n', 1)
                    )
                    
                    media_serializer = MediaAdminSerializer(media)
                    
                    return APIResponse.success(
                        message=AI_SUCCESS["image_generated_and_saved"],
                        data={
                            **media_serializer.data,
                            'saved': True,
                            'generation_time_ms': int((time.time() - start_time) * 1000)
                        },
                        status_code=status.HTTP_201_CREATED
                    )
            else:
                image_bytes, metadata = AIImageGenerationService.generate_image_only(
                    provider_name=model.provider.slug,
                    prompt=data.get('prompt'),
                    admin=request.user,
                    size=data.get('size', '1024x1024'),
                    quality=data.get('quality', 'standard'),
                    style=data.get('style', 'vivid'),
                    n=data.get('n', 1)
                )
                
                image_base64 = base64.b64encode(image_bytes.getvalue()).decode('utf-8')
                
                return APIResponse.success(
                    message=AI_SUCCESS["image_generated_not_saved"],
                    data={
                        'image_data_url': f"data:image/png;base64,{image_base64}",
                        'prompt': data.get('prompt'),
                        'provider': model.provider.display_name,
                        'model': model.display_name,
                        'saved': False,
                        'generation_time_ms': int((time.time() - start_time) * 1000)
                    },
                    status_code=status.HTTP_200_OK
                )
        
        except AIModel.DoesNotExist:
            return APIResponse.error(
                message=AI_ERRORS["model_not_found"],
                status_code=status.HTTP_404_NOT_FOUND
            )
        except ValueError:
            return APIResponse.error(
                message=AI_ERRORS["validation_error"],
                status_code=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return APIResponse.error(
                message=AI_ERRORS["image_generation_failed"].format(error=str(e)),
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'], url_path='models')
    def available_models(self, request):
        models = AIModel.objects.filter(
            provider__is_active=True,
            is_active=True
        ).select_related('provider')
        
        result = []
        for model in models:
            if 'image' not in model.capabilities:
                continue
            
            state = ModelAccessState.calculate(model.provider, model, request.user)
            if state in [ModelAccessState.AVAILABLE_SHARED, ModelAccessState.AVAILABLE_PERSONAL]:
                result.append({
                    'id': model.id,
                    'name': model.display_name,
                    'provider': model.provider.display_name,
                    'capabilities': model.capabilities,
                    'is_free': model.pricing_input is None or model.pricing_input == 0,
                    'access_source': state.value,
                    'config': {
                        'max_size': '1024x1024',
                        'supported_sizes': ['256x256', '512x512', '1024x1024', '1024x1792', '1792x1024']
                    }
                })
        
        return APIResponse.success(
            message=AI_SUCCESS["models_list_retrieved"],
            data=result
        )
