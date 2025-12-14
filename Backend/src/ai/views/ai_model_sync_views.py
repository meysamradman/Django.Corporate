"""
ViewSet برای Sync مدل‌های AI از پنل ادمین
بدون نیاز به SSH یا Terminal
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated

from src.ai.models import AIProvider, AIModel
from src.ai.providers.registry import AIProviderRegistry
from src.core.responses.response import APIResponse
from src.ai.messages.messages import AI_ERRORS
from src.user.access_control import PermissionValidator
from src.ai.utils.cache import AICacheManager


class AIModelSyncViewSet(viewsets.ViewSet):
    """
    ViewSet برای مدیریت و Sync مدل‌های AI
    """
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'], url_path='available-models')
    def get_available_models(self, request):
        """
        دریافت لیست مدل‌های موجود از API provider (بدون ذخیره)
        
        Query Params:
        - provider: slug provider (required)
        - capability: فیلتر بر اساس capability (optional)
        - use_cache: استفاده از cache یا نه (default: true)
        
        این endpoint مدل‌ها را مستقیماً از API می‌خواند
        و در دیتابیس ذخیره نمی‌کند
        """
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
            # بررسی اینکه provider در دیتابیس وجود دارد
            try:
                provider = AIProvider.objects.get(slug=provider_slug, is_active=True)
            except AIProvider.DoesNotExist:
                return APIResponse.error(
                    message=f"Provider '{provider_slug}' not found or inactive",
                    status_code=status.HTTP_404_NOT_FOUND
                )
            
            # بررسی اینکه provider از dynamic models پشتیبانی می‌کند
            if not self._supports_dynamic_models(provider_slug):
                return APIResponse.error(
                    message=f"Provider '{provider_slug}' does not support dynamic models",
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            
            # دریافت کلاس provider
            provider_class = AIProviderRegistry.get(provider_slug)
            if not provider_class or not hasattr(provider_class, 'get_available_models'):
                return APIResponse.error(
                    message=f"Provider '{provider_slug}' does not support model listing",
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            
            # دریافت API key
            api_key = provider.get_shared_api_key() if provider.shared_api_key else None
            
            # دریافت لیست مدل‌ها از API
            # هر provider ممکن است signature متفاوتی داشته باشد
            if provider_slug == 'huggingface':
                # HuggingFace از task_filter استفاده می‌کند
                task_filter = request.query_params.get('task_filter')
                models_data = provider_class.get_available_models(
                    api_key=api_key,
                    task_filter=task_filter,
                    use_cache=use_cache
                )
            elif provider_slug == 'openrouter':
                # OpenRouter از provider_filter استفاده می‌کند
                provider_filter = request.query_params.get('provider_filter')
                models_data = provider_class.get_available_models(
                    api_key=api_key,
                    provider_filter=provider_filter,
                    use_cache=use_cache
                )
            else:
                # Groq و سایر providerها
                models_data = provider_class.get_available_models(
                    api_key=api_key,
                    use_cache=use_cache
                )
            
            if not models_data:
                return APIResponse.success(
                    message="No models found",
                    data={'models': [], 'count': 0}
                )
            
            # فیلتر بر اساس capability (اگر مشخص شده باشد)
            if capability:
                models_data = self._filter_by_capability(
                    models_data, 
                    capability, 
                    provider_slug
                )
            
            # اضافه کردن capabilities به هر مدل
            for model in models_data:
                # HuggingFace ممکن است از 'id' یا 'modelId' استفاده کند
                model_id = model.get('id') or model.get('modelId', '')
                if not model_id:
                    continue
                
                # تشخیص capabilities
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
    
    @action(detail=False, methods=['delete'], url_path='clear-synced-models')
    def clear_synced_models(self, request):
        """
        پاک کردن تمام مدل‌های sync شده از دیتابیس
        
        Query Params:
        - provider: (optional) فقط مدل‌های یک provider خاص را پاک کن
        - keep_active: (optional, default: false) نگه داشتن مدل‌های فعال
        
        این endpoint برای پاک کردن مدل‌های sync شده قبلی استفاده می‌شود
        چون حالا فقط Real-time از API می‌خوانیم و نیازی به ذخیره در DB نیست
        """
        if not PermissionValidator.has_permission(request.user, 'ai.manage'):
            return APIResponse.error(
                message=AI_ERRORS.get("provider_not_authorized", "Not authorized"),
                status_code=status.HTTP_403_FORBIDDEN
            )
        
        provider_slug = request.query_params.get('provider')
        keep_active = request.query_params.get('keep_active', 'false').lower() == 'true'
        
        try:
            # Dynamic providers که از sync استفاده می‌کردند
            dynamic_providers = ['openrouter', 'groq', 'huggingface']
            
            if provider_slug:
                if provider_slug not in dynamic_providers:
                    return APIResponse.error(
                        message=f"Provider '{provider_slug}' is not a dynamic provider",
                        status_code=status.HTTP_400_BAD_REQUEST
                    )
                
                try:
                    provider = AIProvider.objects.get(slug=provider_slug)
                except AIProvider.DoesNotExist:
                    return APIResponse.error(
                        message=f"Provider '{provider_slug}' not found",
                        status_code=status.HTTP_404_NOT_FOUND
                    )
                
                if keep_active:
                    deleted = AIModel.objects.filter(
                        provider=provider,
                        is_active=False
                    ).delete()
                else:
                    deleted = AIModel.objects.filter(provider=provider).delete()
                
                deleted_count = deleted[0]
                provider_name = provider_slug
            else:
                # پاک کردن همه مدل‌های dynamic providers
                providers = AIProvider.objects.filter(slug__in=dynamic_providers)
                
                if keep_active:
                    deleted = AIModel.objects.filter(
                        provider__in=providers,
                        is_active=False
                    ).delete()
                else:
                    deleted = AIModel.objects.filter(provider__in=providers).delete()
                
                deleted_count = deleted[0]
                provider_name = "all dynamic providers"
            
            # Invalidate cache
            AICacheManager.invalidate_models()
            
            return APIResponse.success(
                message=f"Deleted {deleted_count} synced models from {provider_name}",
                data={
                    'deleted_count': deleted_count,
                    'provider': provider_slug or 'all',
                    'kept_active': keep_active
                }
            )
            
        except Exception as e:
            return APIResponse.error(
                message=f"Error clearing synced models: {str(e)}",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'], url_path='synced-models-count')
    def get_synced_models_count(self, request):
        """
        دریافت تعداد مدل‌های sync شده در دیتابیس
        
        Query Params:
        - provider: (optional) فقط تعداد مدل‌های یک provider خاص
        """
        if not PermissionValidator.has_permission(request.user, 'ai.manage'):
            return APIResponse.error(
                message=AI_ERRORS.get("provider_not_authorized", "Not authorized"),
                status_code=status.HTTP_403_FORBIDDEN
            )
        
        provider_slug = request.query_params.get('provider')
        dynamic_providers = ['openrouter', 'groq', 'huggingface']
        
        try:
            if provider_slug:
                if provider_slug not in dynamic_providers:
                    return APIResponse.error(
                        message=f"Provider '{provider_slug}' is not a dynamic provider",
                        status_code=status.HTTP_400_BAD_REQUEST
                    )
                
                try:
                    provider = AIProvider.objects.get(slug=provider_slug)
                except AIProvider.DoesNotExist:
                    return APIResponse.error(
                        message=f"Provider '{provider_slug}' not found",
                        status_code=status.HTTP_404_NOT_FOUND
                    )
                
                total_count = AIModel.objects.filter(provider=provider).count()
                active_count = AIModel.objects.filter(provider=provider, is_active=True).count()
                inactive_count = total_count - active_count
                
                provider_name = provider_slug
            else:
                # تعداد همه مدل‌های dynamic providers
                providers = AIProvider.objects.filter(slug__in=dynamic_providers)
                
                total_count = AIModel.objects.filter(provider__in=providers).count()
                active_count = AIModel.objects.filter(provider__in=providers, is_active=True).count()
                inactive_count = total_count - active_count
                
                provider_name = "all dynamic providers"
            
            return APIResponse.success(
                message=f"Found {total_count} synced models in {provider_name}",
                data={
                    'provider': provider_slug or 'all',
                    'total_count': total_count,
                    'active_count': active_count,
                    'inactive_count': inactive_count
                }
            )
            
        except Exception as e:
            return APIResponse.error(
                message=f"Error getting synced models count: {str(e)}",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    # Helper Methods
    
    def _supports_dynamic_models(self, provider_slug: str) -> bool:
        """بررسی اینکه آیا provider از dynamic models پشتیبانی می‌کند"""
        return provider_slug in ['openrouter', 'huggingface', 'groq']
    
    def _detect_capabilities(self, model_data: dict, provider_slug: str) -> list:
        """تشخیص capabilities یک مدل"""
        # HuggingFace ممکن است از 'id' یا 'modelId' استفاده کند
        model_id = (model_data.get('id') or model_data.get('modelId', '')).lower()
        name = (model_data.get('name') or model_data.get('modelId', '')).lower()
        description = model_data.get('description', '').lower()
        task = model_data.get('task') or model_data.get('pipeline_tag', '')
        task = task.lower() if task else ''
        
        capabilities = []
        
        # Image models
        image_keywords = ['dall-e', 'stable-diffusion', 'flux', 'midjourney', 'imagen', 'image']
        if any(kw in model_id or kw in name for kw in image_keywords):
            capabilities.append('image')
        
        # HuggingFace task-based
        if provider_slug == 'huggingface':
            if task in ['text-to-image', 'image-to-image']:
                capabilities.append('image')
            if task == 'text-generation':
                capabilities.extend(['chat', 'content'])
            if task in ['text-to-speech', 'automatic-speech-recognition']:
                capabilities.append('text_to_speech')
        
        # TTS models
        tts_keywords = ['tts', 'text-to-speech', 'whisper', 'audio']
        if any(kw in model_id or kw in name for kw in tts_keywords):
            capabilities.append('text_to_speech')
        
        # اگر هیچ capability خاصی نیست، chat و content
        if not capabilities:
            text_keywords = ['gpt', 'llama', 'gemini', 'claude', 'mistral', 'chat', 'instruct']
            if any(kw in model_id or kw in name for kw in text_keywords):
                capabilities.extend(['chat', 'content'])
        
        # حداقل یک capability
        if not capabilities:
            capabilities.append('chat')
        
        return list(set(capabilities))
    
    def _filter_by_capability(self, models_data: list, capability: str, provider_slug: str) -> list:
        """فیلتر مدل‌ها بر اساس capability"""
        filtered = []
        for model_data in models_data:
            capabilities = self._detect_capabilities(model_data, provider_slug)
            if capability in capabilities:
                filtered.append(model_data)
        return filtered

