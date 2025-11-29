""" 
✅ AI Image Generation Views (2025)

Provider Management + Image Generation
Integrated with dynamic AIProvider system
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
import time
import base64

from src.ai.models import AIProvider, AIModel, AdminProviderSettings
from src.ai.services.state_machine import ModelAccessState
from src.ai.services.image_generation_service import AIImageGenerationService
from src.ai.serializers.image_generation_serializer import (
    AIProviderSerializer,
    AIProviderListSerializer,
    AIImageGenerationRequestSerializer,
)
from src.ai.messages.messages import AI_SUCCESS, AI_ERRORS
from src.user.auth.admin_session_auth import CSRFExemptSessionAuthentication
from src.core.responses import APIResponse
from src.user.authorization import AiManagerAccess, SuperAdminOnly
from src.user.permissions import PermissionValidator


class AIImageProviderViewSet(viewsets.ModelViewSet):
    """
    ✅ Provider Management ViewSet (11 actions)
    فقط سوپر ادمین - مدیریت API Keys و Providers
    """
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
        """
        لیست همه Providers
        ✅ اگر سوپر ادمین است، همه provider ها را ببین (فعال و غیرفعال)
        ✅ اگر ادمین معمولی است، فقط provider های فعال را ببین
        """
        # ✅ اگر سوپر ادمین است، همه provider ها را ببین
        is_super = getattr(request.user, 'is_superuser', False) or getattr(request.user, 'is_admin_full', False)
        if is_super:
            providers = self.get_queryset()
        else:
            # ✅ برای ادمین‌های معمولی: فقط provider های فعال را نمایش بده
            providers = AIProvider.objects.filter(is_active=True).order_by('sort_order', 'display_name')
        
        serializer = self.get_serializer(providers, many=True)
        
        return APIResponse.success(
            message=AI_SUCCESS.get("providers_list_retrieved", "لیست Provider ها دریافت شد"),
            data=serializer.data
        )
    
    def update(self, request, *args, **kwargs):
        """آپدیت Provider (API key, config, etc.)"""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        return APIResponse.success(
            message=AI_SUCCESS.get("provider_updated", "Provider به‌روزرسانی شد"),
            data=serializer.data
        )
    
    def create(self, request, *args, **kwargs):
        """ایجاد یا آپدیت Provider"""
        slug = request.data.get('slug')
        if not slug:
            return APIResponse.error(
                message="slug الزامی است",
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            provider = AIProvider.objects.get(slug=slug)
            serializer = self.get_serializer(provider, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            self.perform_update(serializer)
            return APIResponse.success(
                message=AI_SUCCESS.get("provider_updated", "Provider به‌روزرسانی شد"),
                data=serializer.data,
                status_code=status.HTTP_200_OK
            )
        except AIProvider.DoesNotExist:
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)
            return APIResponse.success(
                message=AI_SUCCESS.get("provider_created", "Provider ایجاد شد"),
                data=serializer.data,
                status_code=status.HTTP_201_CREATED
            )
    
    @action(detail=False, methods=['get'], url_path='capabilities')
    def get_capabilities(self, request):
        """دریافت قابلیت‌های Providers"""
        from src.ai.providers.capabilities import PROVIDER_CAPABILITIES, get_provider_capabilities
        
        provider_slug = request.query_params.get('provider')
        
        if provider_slug:
            caps = get_provider_capabilities(provider_slug)
            return APIResponse.success(
                message=f"قابلیت‌های {provider_slug} دریافت شد",
                data=caps
            )
        
        return APIResponse.success(
            message="قابلیت‌های تمام Provider ها دریافت شد",
            data=PROVIDER_CAPABILITIES
        )
    
    @action(detail=False, methods=['get'], url_path='available')
    def available_providers(self, request):
        """لیست Provider های فعال (با permission check)"""
        if not PermissionValidator.has_permission(request.user, 'ai.manage'):
            return APIResponse.error(
                message=AI_ERRORS.get("provider_not_authorized", "شما دسترسی لازم ندارید"),
                status_code=status.HTTP_403_FORBIDDEN
            )
        
        providers = AIProvider.objects.filter(is_active=True)
        serializer = AIProviderListSerializer(providers, many=True)
        
        available = [
            p for p in serializer.data
            if p.get('has_shared_api_key') or p.get('allow_personal_keys')
        ]
        
        return APIResponse.success(
            message=AI_SUCCESS.get("providers_list_retrieved", "لیست Provider های فعال دریافت شد"),
            data=available
        )
    
    @action(detail=False, methods=['get'], url_path='openrouter-models')
    def openrouter_models(self, request):
        """لیست مدل‌های OpenRouter (با cache 6 ساعته)"""
        if not PermissionValidator.has_permission(request.user, 'ai.manage'):
            return APIResponse.error(
                message="شما دسترسی لازم ندارید",
                status_code=status.HTTP_403_FORBIDDEN
            )
        
        try:
            from src.ai.providers.openrouter import OpenRouterProvider
            
            # Get API key
            try:
                provider = AIProvider.objects.get(slug='openrouter', is_active=True)
            except AIProvider.DoesNotExist:
                return APIResponse.error(
                    message="OpenRouter فعال نیست. لطفاً ابتدا OpenRouter را در تنظیمات AI فعال کنید.",
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            
            # ✅ بهینه: منطق ساده و واضح برای دریافت API key
            # ✅ بهینه شده: استفاده از select_related برای جلوگیری از N+1 query
            import logging
            logger = logging.getLogger(__name__)
            
            settings = AdminProviderSettings.objects.filter(
                admin=request.user,
                provider=provider,
                is_active=True
            ).select_related('provider').first()
            
            api_key = None
            
            # Strategy 1: اگر settings وجود دارد
            if settings:
                # اول سعی کن از get_api_key() بگیر (طبق use_shared_api)
                try:
                    api_key = settings.get_api_key()
                    logger.info(f"[AI Image API] Using API key from settings (use_shared_api={settings.use_shared_api})")
                except Exception as e:
                    logger.warning(f"[AI Image API] get_api_key() failed: {e}")
                    # اگر use_shared_api=True است اما shared key نیست، personal را چک کن
                    if settings.use_shared_api:
                        # shared API key تنظیم نشده، personal را امتحان کن
                        personal_key = settings.get_personal_api_key()
                        if personal_key and personal_key.strip():
                            api_key = personal_key
                            logger.info(f"[AI Image API] Fallback: Using personal API key")
                        else:
                            logger.warning(f"[AI Image API] Personal API key also empty")
                    else:
                        # use_shared_api=False اما personal هم نیست
                        logger.warning(f"[AI Image API] Personal API key not set")
            
            # Strategy 2: اگر هنوز API key نداریم، shared provider را چک کن
            if not api_key or not api_key.strip():
                shared_key = provider.get_shared_api_key()
                if shared_key and shared_key.strip():
                    api_key = shared_key
                    logger.info(f"[AI Image API] Using shared provider API key")
                else:
                    logger.warning(f"[AI Image API] Shared provider API key also empty")
            
            use_cache = request.query_params.get('use_cache', 'true').lower() != 'false'
            
            # ✅ داینامیک: همیشه از OpenRouter API می‌گیریم (حتی بدون API key)
            # OpenRouter API ممکن است لیست مدل‌ها را بدون auth هم بدهد
            final_api_key = api_key if (api_key and api_key.strip()) else None
            models = OpenRouterProvider.get_available_models(
                api_key=final_api_key,
                provider_filter=None,
                use_cache=use_cache
            )
            
            # Filter image models
            image_models = [
                m for m in models
                if any(kw in m['id'].lower() for kw in ['dall-e', 'flux', 'stable', 'midjourney'])
            ]
            
            return APIResponse.success(
                message=f"لیست مدل‌های تولید تصویر OpenRouter دریافت شد{' (از کش)' if use_cache else ' (تازه)'}",
                data=image_models
            )
        except Exception as e:
            return APIResponse.error(
                message=f"خطا در دریافت لیست مدل‌ها: {str(e)}",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'], url_path='huggingface-models')
    def huggingface_models(self, request):
        """لیست مدل‌های Hugging Face (با cache 6 ساعته)"""
        if not PermissionValidator.has_permission(request.user, 'ai.manage'):
            return APIResponse.error(
                message="شما دسترسی لازم ندارید",
                status_code=status.HTTP_403_FORBIDDEN
            )
        
        try:
            from src.ai.providers.huggingface import HuggingFaceProvider
            
            # Get API key
            try:
                provider = AIProvider.objects.get(slug='huggingface', is_active=True)
            except AIProvider.DoesNotExist:
                return APIResponse.error(
                    message="Hugging Face فعال نیست. لطفاً ابتدا Hugging Face را در تنظیمات AI فعال کنید.",
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            
            import logging
            logger = logging.getLogger(__name__)
            
            settings = AdminProviderSettings.objects.filter(
                admin=request.user,
                provider=provider,
                is_active=True
            ).first()
            
            api_key = None
            
            # Strategy 1: اگر settings وجود دارد
            if settings:
                try:
                    api_key = settings.get_api_key()
                    logger.info(f"[AI Image API] Using HuggingFace API key from settings")
                except Exception as e:
                    logger.warning(f"[AI Image API] get_api_key() failed: {e}")
                    if settings.use_shared_api:
                        personal_key = settings.get_personal_api_key()
                        if personal_key and personal_key.strip():
                            api_key = personal_key
                    else:
                        personal_key = settings.get_personal_api_key()
                        if personal_key and personal_key.strip():
                            api_key = personal_key
            
            # Strategy 2: اگر هنوز API key نداریم، shared provider را چک کن
            if not api_key or not api_key.strip():
                shared_key = provider.get_shared_api_key()
                if shared_key and shared_key.strip():
                    api_key = shared_key
                    logger.info(f"[AI Image API] Using shared HuggingFace API key")
            
            use_cache = request.query_params.get('use_cache', 'true').lower() != 'false'
            task_filter = request.query_params.get('task', None)  # 'text-to-image', 'text-generation', etc.
            
            # Get models from Hugging Face API
            models = HuggingFaceProvider.get_available_models(
                api_key=api_key if (api_key and api_key.strip()) else None,
                task_filter=task_filter,
                use_cache=use_cache
            )
            
            logger.info(f"[AI Image View] Found {len(models)} HuggingFace models")
            
            return APIResponse.success(
                message="لیست مدل‌های Hugging Face دریافت شد" + (" (از کش)" if use_cache else " (تازه)"),
                data=models,
                status_code=status.HTTP_200_OK
            )
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"[AI Image View] Error getting HuggingFace models: {str(e)}", exc_info=True)
            return APIResponse.error(
                message=f"خطا در دریافت لیست مدل‌های Hugging Face: {str(e)}",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'], url_path='clear-openrouter-cache')
    def clear_openrouter_cache(self, request):
        """پاک کردن cache مدل‌های OpenRouter"""
        if not PermissionValidator.has_permission(request.user, 'ai.manage'):
            return APIResponse.error(
                message="شما دسترسی لازم ندارید",
                status_code=status.HTTP_403_FORBIDDEN
            )
        
        try:
            from src.ai.providers.openrouter import OpenRouterModelCache
            OpenRouterModelCache.clear_all()
            
            return APIResponse.success(
                message="کش تمام مدل‌های OpenRouter پاک شد"
            )
        except Exception as e:
            return APIResponse.error(
                message=f"خطا در پاک کردن کش: {str(e)}",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'], url_path='activate')
    def activate_provider(self, request, pk=None, id=None):
        """فعال‌سازی Provider (با validation API key)"""
        provider = self.get_object()
        
        if not provider.shared_api_key:
            return APIResponse.error(
                message=AI_ERRORS.get("api_key_required", "API key الزامی است"),
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Validate API key
            is_valid = AIImageGenerationService.validate_provider_api_key(
                provider.slug,
                provider.get_shared_api_key()
            )
            
            if not is_valid:
                return APIResponse.error(
                    message=AI_ERRORS.get("api_key_invalid", "API key نامعتبر است"),
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            
            provider.is_active = True
            provider.save(update_fields=['is_active', 'updated_at'])
            
            serializer = self.get_serializer(provider)
            return APIResponse.success(
                message=AI_SUCCESS.get("provider_activated", "Provider فعال شد"),
                data=serializer.data
            )
        except Exception as e:
            return APIResponse.error(
                message=AI_ERRORS.get("activation_failed", "فعال‌سازی ناموفق بود").format(error=str(e)),
                status_code=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'], url_path='deactivate')
    def deactivate_provider(self, request, pk=None, id=None):
        """غیرفعال‌سازی Provider"""
        provider = self.get_object()
        provider.is_active = False
        provider.save(update_fields=['is_active', 'updated_at'])
        
        serializer = self.get_serializer(provider)
        return APIResponse.success(
            message=AI_SUCCESS.get("provider_deactivated", "Provider غیرفعال شد"),
            data=serializer.data
        )
    
    @action(detail=True, methods=['post'], url_path='validate-api-key')
    def validate_api_key(self, request, pk=None):
        """اعتبارسنجی API key"""
        provider = self.get_object()
        
        if not provider.shared_api_key:
            return APIResponse.error(
                message=AI_ERRORS.get("api_key_not_provided", "API key وارد نشده است"),
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            is_valid = AIImageGenerationService.validate_provider_api_key(
                provider.slug,
                provider.get_shared_api_key()
            )
            
            message = AI_SUCCESS.get("api_key_valid", "API key معتبر است") if is_valid else AI_ERRORS.get("api_key_invalid", "API key نامعتبر است")
            return APIResponse.success(
                message=message,
                data={'valid': is_valid}
            )
        except Exception as e:
            return APIResponse.error(
                message=AI_ERRORS.get("validation_error", "خطا در اعتبارسنجی").format(error=str(e)),
                status_code=status.HTTP_400_BAD_REQUEST
            )


class AIImageGenerationViewSet(viewsets.ViewSet):
    """
    ✅ Image Generation ViewSet
    دسترسی برای AiManager - تولید تصویر
    """
    authentication_classes = [CSRFExemptSessionAuthentication]
    permission_classes = [AiManagerAccess]
    
    @action(detail=False, methods=['post'], url_path='generate')
    def generate_image(self, request):
        """تولید تصویر با AI"""
        if not PermissionValidator.has_permission(request.user, 'ai.image.manage'):
            return APIResponse.error(
                message=AI_ERRORS.get("image_not_authorized", "شما دسترسی لازم ندارید"),
                status_code=status.HTTP_403_FORBIDDEN
            )
        
        serializer = AIImageGenerationRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return APIResponse.error(
                message=AI_ERRORS.get("prompt_invalid", "درخواست نامعتبر است"),
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        data = serializer.validated_data
        model_id = data.get('model_id')
        save_to_db = data.get('save_to_media', True)
        
        try:
            model = AIModel.objects.select_related('provider').get(id=model_id)
            
            # Check access
            state = ModelAccessState.calculate(model.provider, model, request.user)
            if state not in [ModelAccessState.AVAILABLE_SHARED, ModelAccessState.AVAILABLE_PERSONAL]:
                return APIResponse.error(
                    message="شما به این مدل دسترسی ندارید",
                    status_code=status.HTTP_403_FORBIDDEN
                )
            
            # Check capability
            if 'image' not in model.capabilities:
                return APIResponse.error(
                    message="این مدل قابلیت تولید تصویر ندارد",
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
                    
                    from src.media.serializers.media_serializer import MediaAdminSerializer
                    media_serializer = MediaAdminSerializer(media)
                    
                    return APIResponse.success(
                        message=AI_SUCCESS.get("image_generated_and_saved", "تصویر تولید و ذخیره شد"),
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
                    message=AI_SUCCESS.get("image_generated_not_saved", "تصویر تولید شد"),
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
                message="مدل یافت نشد",
                status_code=status.HTTP_404_NOT_FOUND
            )
        except ValueError as e:
            return APIResponse.error(
                message=str(e),
                status_code=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return APIResponse.error(
                message=AI_ERRORS.get("image_generation_failed", "خطا در تولید تصویر").format(error=str(e)),
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'], url_path='models')
    def available_models(self, request):
        """لیست مدل‌های تولید تصویر موجود"""
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
            message="لیست مدل‌های تولید تصویر دریافت شد",
            data=result
        )
