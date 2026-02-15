from rest_framework import viewsets, status
from rest_framework.decorators import action
from django.db import transaction
import time
import base64

from src.ai.models import AIProvider, AdminProviderSettings, AICapabilityModel
from src.ai.utils.state_machine import ModelAccessState
from src.ai.utils.error_mapper import map_ai_exception
from src.ai.services.image_generation_service import AIImageGenerationService
from src.ai.serializers.image_generation_serializer import (
    AIProviderSerializer,
    AIProviderListSerializer,
    AIImageGenerationRequestSerializer,
)
from src.ai.messages.messages import AI_SUCCESS, AI_ERRORS
from src.user.auth.admin_session_auth import CSRFExemptSessionAuthentication
from src.core.responses.response import APIResponse
from src.user.access_control import ai_permission, SuperAdminOnly, PermissionValidator
from src.ai.providers.capabilities import PROVIDER_CAPABILITIES, get_provider_capabilities, get_default_model
from src.ai.providers.openrouter import OpenRouterProvider, OpenRouterModelCache
from src.ai.providers.huggingface import HuggingFaceProvider
from src.ai.services.provider_access_service import ProviderAccessService
from src.media.serializers.media_serializer import MediaAdminSerializer

class AIImageProviderViewSet(viewsets.ModelViewSet):
    authentication_classes = [CSRFExemptSessionAuthentication]
    permission_classes = [ai_permission]
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
        """Returns providers that support image generation with their hardcoded models."""
        try:
            is_super = getattr(request.user, 'is_superuser', False) or getattr(request.user, 'is_admin_full', False)
            
            providers_qs = AIProvider.objects.filter(is_active=True).order_by('sort_order', 'display_name')
            
            result = []
            for provider in providers_qs:
                # Check if provider supports image
                if not provider.supports_capability('image'):
                    continue
                    
                has_access = self._check_provider_access(request.user, provider, is_super)
                
                provider_info = {
                    'id': provider.id,
                    'slug': provider.slug,
                    'provider_name': provider.display_name,
                    'display_name': provider.display_name,
                    'description': provider.description,
                    'has_access': has_access,
                    'capabilities': provider.capabilities,
                }
                result.append(provider_info)
            
            return APIResponse.success(
                message=AI_SUCCESS["providers_list_retrieved"],
                data=result
            )
        except Exception as e:
            return APIResponse.error(
                message=AI_ERRORS["providers_list_error"],
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
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

            # Product rule: image panel model options should follow hardcoded capabilities.py first.
            static_models = provider.get_static_models('image') or []
            if static_models:
                data = [
                    {
                        'id': model_id,
                        'name': model_id,
                        'provider_slug': 'openrouter',
                        'is_active': True,
                    }
                    for model_id in static_models
                ]
                return APIResponse.success(
                    message=AI_SUCCESS["openrouter_models_retrieved"].format(from_cache=""),
                    data=data,
                    status_code=status.HTTP_200_OK
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
                message=AI_ERRORS["openrouter_models_error"],
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

            # Product rule: image panel model options should follow hardcoded capabilities.py first.
            static_models = provider.get_static_models('image') or []
            if static_models:
                data = [
                    {
                        'id': model_id,
                        'name': model_id,
                        'provider_slug': 'huggingface',
                        'is_active': True,
                    }
                    for model_id in static_models
                ]
                return APIResponse.success(
                    message=AI_SUCCESS["huggingface_models_retrieved"].format(from_cache=""),
                    data=data,
                    status_code=status.HTTP_200_OK
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
                capability='image',
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
                message=AI_ERRORS["huggingface_models_error"],
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'], url_path='clear-openrouter-cache')
    def clear_openrouter_cache(self, request):
        try:
            OpenRouterModelCache.clear_all()
            
            return APIResponse.success(
                message=AI_SUCCESS["cache_cleared"]
            )
        except Exception as e:
            return APIResponse.error(
                message=AI_ERRORS["cache_clear_error"],
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
                message=AI_ERRORS["activation_failed"],
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
                message=AI_ERRORS["validation_error"],
                status_code=status.HTTP_400_BAD_REQUEST
            )
    
    def _check_provider_access(self, user, provider, is_super: bool) -> bool:
        return ProviderAccessService.can_admin_access_provider(
            user=user,
            provider=provider,
            is_super=is_super,
        )

class AIImageGenerationViewSet(viewsets.ViewSet):
    authentication_classes = [CSRFExemptSessionAuthentication]
    permission_classes = [ai_permission]
    
    @action(detail=False, methods=['post'], url_path='generate')
    def generate_image(self, request):
        serializer = AIImageGenerationRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return APIResponse.error(
                message=AI_ERRORS["prompt_invalid"],
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        data = serializer.validated_data
        provider_name = data.get('provider_name')
        save_to_db = data.get('save_to_media', False)
        
        try:
            provider = None
            active_model = None

            # If provider is not specified, use the single active capability mapping.
            if not provider_name:
                active_model = AICapabilityModel.objects.get_active('image')
                if not active_model:
                    return APIResponse.error(
                        message=AI_ERRORS.get('no_active_model_any_provider').format(capability='image'),
                        status_code=status.HTTP_400_BAD_REQUEST
                    )

                provider = active_model.provider

                state = ModelAccessState.calculate(provider, active_model, request.user)
                if state not in [ModelAccessState.AVAILABLE_SHARED, ModelAccessState.AVAILABLE_PERSONAL]:
                    return APIResponse.error(
                        message=AI_ERRORS["model_access_denied"],
                        status_code=status.HTTP_403_FORBIDDEN
                    )
                
                model_id = active_model.model_id
                model_display_name = active_model.display_name or active_model.model_id

            else:
                try:
                    provider = AIProvider.objects.get(slug=provider_name, is_active=True)
                except AIProvider.DoesNotExist:
                    return APIResponse.error(
                        message=AI_ERRORS["provider_not_found_or_inactive"],
                        status_code=status.HTTP_400_BAD_REQUEST
                    )

                # Determine model ID (Check request override -> active -> default)
                # Allow user to override model via request.data['model'] or ['model_id']
                requested_model = data.get('model') or data.get('model_id')
                
                if requested_model:
                    model_id = requested_model
                    model_display_name = requested_model
                else:
                    active_model = AICapabilityModel.objects.get_active('image')
                    
                    if active_model and active_model.provider_id == provider.id:
                        model_id = active_model.model_id
                        model_display_name = active_model.display_name or active_model.model_id
                    else:
                        # On-the-fly provider selection (Default fallback)
                        model_id = get_default_model(provider.slug, 'image')
                        if not model_id and provider.capabilities:
                            model_id = provider.capabilities.get('image', {}).get('default_model')
                        
                        if not model_id:
                            static_models = provider.get_static_models('image')
                            if static_models:
                                model_id = static_models[0]
                        
                        if not model_id:
                            return APIResponse.error(
                                message=AI_ERRORS["no_active_model"],
                                status_code=status.HTTP_400_BAD_REQUEST
                            )
                        model_display_name = model_id

                # Permission Check
                is_super = getattr(request.user, 'is_superuser', False) or getattr(request.user, 'is_admin_full', False)
                has_access = False
                
                if is_super:
                    has_access = True
                else:
                    settings = AdminProviderSettings.objects.filter(admin=request.user, provider=provider, is_active=True).first()
                    if settings and settings.personal_api_key:
                        has_access = True
                    elif provider.allow_shared_for_normal_admins and provider.shared_api_key:
                        has_access = True
                
                if not has_access:
                    return APIResponse.error(
                        message=AI_ERRORS["model_access_denied"],
                        status_code=status.HTTP_403_FORBIDDEN
                    )

            
            start_time = time.time()
            
            if save_to_db:
                with transaction.atomic():
                    media = AIImageGenerationService.generate_and_save_to_media(
                        provider_name=provider.slug,
                        prompt=data.get('prompt'),
                        admin=request.user,
                        title=data.get('title', data.get('prompt')[:100]),
                        alt_text=data.get('alt_text', data.get('prompt')[:200]),
                        save_to_db=True,
                        model_name=model_id,
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
                    provider_name=provider.slug,
                    prompt=data.get('prompt'),
                    admin=request.user,
                    model_name=model_id,
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
                        'provider': provider.display_name,
                        'model': model_display_name,
                        'saved': False,
                        'generation_time_ms': int((time.time() - start_time) * 1000)
                    },
                    status_code=status.HTTP_200_OK
                )
        
        except ValueError as e:
            return APIResponse.error(
                message=AI_ERRORS["validation_error"],
                status_code=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            final_msg, status_code = map_ai_exception(
                e,
                AI_ERRORS["image_generation_failed_simple"],
                domain="image"
            )

            return APIResponse.error(
                message=final_msg,
                status_code=status_code
            )
    
    @action(detail=False, methods=['get'], url_path='models')
    def available_models(self, request):
        # Legacy endpoint kept to avoid breaking older clients.
        # Model selection is no longer supported.
        return APIResponse.success(
            message=AI_SUCCESS.get("models_list_retrieved"),
            data=[]
        )
