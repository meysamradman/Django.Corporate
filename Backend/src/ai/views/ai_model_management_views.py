from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from django.core.cache import cache

from src.core.responses.response import APIResponse
from src.ai.models import AIProvider, AIModel
from src.ai.providers.registry import AIProviderRegistry
from src.ai.messages.messages import AI_SUCCESS, AI_ERRORS
from src.user.access_control import PermissionValidator
from src.ai.utils.cache import AICacheManager


class AIModelManagementViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'], url_path='browse-models')
    def browse_models(self, request):
        if not PermissionValidator.has_permission(request.user, 'ai.manage'):
            return APIResponse.error(
                message=AI_ERRORS.get("provider_not_authorized", "Not authorized"),
                status_code=status.HTTP_403_FORBIDDEN
            )
        
        provider_slug = request.query_params.get('provider')
        if not provider_slug:
            return APIResponse.error(
                message="Provider parameter is required",
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        capability = request.query_params.get('capability')
        use_cache = request.query_params.get('use_cache', 'true').lower() != 'false'
        
        try:
            try:
                provider = AIProvider.objects.get(slug=provider_slug, is_active=True)
            except AIProvider.DoesNotExist:
                return APIResponse.error(
                    message=f"Provider '{provider_slug}' not found or inactive",
                    status_code=status.HTTP_404_NOT_FOUND
                )
            
            provider_class = AIProviderRegistry.get(provider_slug)
            if not provider_class or not hasattr(provider_class, 'get_available_models'):
                return APIResponse.error(
                    message=f"Provider '{provider_slug}' does not support model listing",
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            
            api_key = provider.get_shared_api_key() if provider.shared_api_key else None
            
            models_data = self._fetch_models_from_provider(
                provider_class,
                provider_slug,
                api_key,
                use_cache,
                request.query_params
            )
            
            if not models_data:
                return APIResponse.success(
                    message="No models found",
                    data={'models': [], 'count': 0}
                )
            
            if capability:
                models_data = self._filter_by_capability(models_data, capability, provider_slug)
            
            for model in models_data:
                if 'capabilities' not in model:
                    model['capabilities'] = self._detect_capabilities(model, provider_slug)
            
            return APIResponse.success(
                message=f"Found {len(models_data)} models from {provider_slug}",
                data={
                    'provider': provider_slug,
                    'models': models_data,
                    'count': len(models_data),
                    'capability_filter': capability
                }
            )
            
        except Exception as e:
            return APIResponse.error(
                message=f"Error fetching models: {str(e)}",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'], url_path='select-model')
    def select_model(self, request):
        if not PermissionValidator.has_permission(request.user, 'ai.manage'):
            return APIResponse.error(
                message=AI_ERRORS.get("provider_not_authorized", "Not authorized"),
                status_code=status.HTTP_403_FORBIDDEN
            )
        
        provider_slug = request.data.get('provider')
        capability = request.data.get('capability')
        model_id = request.data.get('model_id')
        model_name = request.data.get('model_name')
        
        if not all([provider_slug, capability, model_id, model_name]):
            return APIResponse.error(
                message="Missing required fields: provider, capability, model_id, model_name",
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            provider = AIProvider.objects.get(slug=provider_slug, is_active=True)
            
            AIModel.objects.deactivate_other_models(
                provider_id=provider.id,
                capability=capability
            )
            
            model, created = AIModel.objects.update_or_create(
                provider=provider,
                model_id=model_id,
                defaults={
                    'name': model_name,
                    'display_name': model_name,
                    'capabilities': [capability],
                    'is_active': True,
                    'pricing_input': request.data.get('pricing_input'),
                    'pricing_output': request.data.get('pricing_output'),
                }
            )
            
            AICacheManager.invalidate_models()
            cache_key = f"active_model_{provider_slug}_{capability}"
            cache.delete(cache_key)
            
            return APIResponse.success(
                message=f"Model {'created' if created else 'updated'} successfully",
                data={
                    'id': model.id,
                    'model_id': model.model_id,
                    'name': model.display_name,
                    'capability': capability,
                    'is_active': model.is_active,
                    'created': created
                }
            )
            
        except AIProvider.DoesNotExist:
            return APIResponse.error(
                message=f"Provider '{provider_slug}' not found",
                status_code=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return APIResponse.error(
                message=f"Error selecting model: {str(e)}",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'], url_path='selected-models')
    def get_selected_models(self, request):
        if not PermissionValidator.has_permission(request.user, 'ai.manage'):
            return APIResponse.error(
                message=AI_ERRORS.get("provider_not_authorized", "Not authorized"),
                status_code=status.HTTP_403_FORBIDDEN
            )
        
        provider_slug = request.query_params.get('provider')
        capability = request.query_params.get('capability')
        
        try:
            queryset = AIModel.objects.filter(
                is_active=True,
                provider__is_active=True
            ).select_related('provider').order_by('provider__sort_order', 'sort_order')
            
            if provider_slug:
                queryset = queryset.filter(provider__slug=provider_slug)
            
            if capability:
                queryset = [m for m in queryset if capability in m.capabilities]
            else:
                queryset = list(queryset)
            
            result = []
            for model in queryset:
                result.append({
                    'id': model.id,
                    'model_id': model.model_id,
                    'name': model.display_name,
                    'provider': {
                        'slug': model.provider.slug,
                        'name': model.provider.display_name
                    },
                    'capabilities': model.capabilities,
                    'pricing_input': float(model.pricing_input) if model.pricing_input else None,
                    'pricing_output': float(model.pricing_output) if model.pricing_output else None,
                    'is_active': model.is_active
                })
            
            return APIResponse.success(
                message="Selected models retrieved successfully",
                data={'models': result, 'count': len(result)}
            )
            
        except Exception as e:
            return APIResponse.error(
                message=f"Error retrieving selected models: {str(e)}",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'], url_path='active-model')
    def get_active_model(self, request):
        provider_slug = request.query_params.get('provider')
        capability = request.query_params.get('capability')
        
        if not provider_slug or not capability:
            return APIResponse.error(
                message="Both provider and capability are required",
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            model = AIModel.objects.get_active_model(provider_slug, capability)
            
            if not model:
                return APIResponse.error(
                    message=f"No active model found for {provider_slug}/{capability}",
                    status_code=status.HTTP_404_NOT_FOUND
                )
            
            return APIResponse.success(
                message="Active model retrieved",
                data={
                    'id': model.id,
                    'model_id': model.model_id,
                    'name': model.display_name,
                    'provider': model.provider.slug,
                    'capabilities': model.capabilities
                }
            )
            
        except Exception as e:
            return APIResponse.error(
                message=f"Error retrieving active model: {str(e)}",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def _fetch_models_from_provider(self, provider_class, provider_slug: str, 
                                    api_key: str, use_cache: bool, query_params) -> list:
        if provider_slug == 'huggingface':
            task_filter = query_params.get('task_filter')
            return provider_class.get_available_models(
                api_key=api_key,
                task_filter=task_filter,
                use_cache=use_cache
            )
        elif provider_slug == 'openrouter':
            provider_filter = query_params.get('provider_filter')
            return provider_class.get_available_models(
                api_key=api_key,
                provider_filter=provider_filter,
                use_cache=use_cache
            )
        else:
            return provider_class.get_available_models(
                api_key=api_key,
                use_cache=use_cache
            )
    
    def _detect_capabilities(self, model_data: dict, provider_slug: str) -> list:
        model_id = (model_data.get('id') or model_data.get('modelId', '')).lower()
        name = (model_data.get('name') or model_data.get('modelId', '')).lower()
        task = model_data.get('task') or model_data.get('pipeline_tag', '')
        task = task.lower() if task else ''
        
        capabilities = []
        
        image_keywords = ['dall-e', 'stable-diffusion', 'flux', 'midjourney', 'imagen', 'image']
        if any(kw in model_id or kw in name for kw in image_keywords):
            capabilities.append('image')
        
        if provider_slug == 'huggingface':
            if task in ['text-to-image', 'image-to-image']:
                capabilities.append('image')
            if task == 'text-generation':
                capabilities.extend(['chat', 'content'])
            if task in ['text-to-speech', 'automatic-speech-recognition']:
                capabilities.append('audio')
        
        audio_keywords = ['tts', 'text-to-speech', 'whisper', 'audio']
        if any(kw in model_id or kw in name for kw in audio_keywords):
            capabilities.append('audio')
        
        if not capabilities:
            text_keywords = ['gpt', 'llama', 'gemini', 'claude', 'mistral', 'chat', 'instruct']
            if any(kw in model_id or kw in name for kw in text_keywords):
                capabilities.extend(['chat', 'content'])
        
        if not capabilities:
            capabilities.append('chat')
        
        return list(set(capabilities))
    
    def _filter_by_capability(self, models_data: list, capability: str, provider_slug: str) -> list:
        filtered = []
        for model_data in models_data:
            capabilities = self._detect_capabilities(model_data, provider_slug)
            if capability in capabilities:
                filtered.append(model_data)
        return filtered
