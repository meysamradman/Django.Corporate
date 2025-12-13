"""
Unified AI Service - سرویس واحد برای تمام عملیات AI

این سرویس جایگزین سرویس‌های جداگانه (image, content, chat, audio) می‌شود
و از Registry Pattern برای مدیریت Providerها استفاده می‌کند.
"""

import asyncio
from typing import Optional, Dict, Any, List
from io import BytesIO
from django.core.cache import cache

from src.ai.models import AIProvider, AIModel, AdminProviderSettings
from src.ai.providers.registry import AIProviderRegistry, get_provider_instance
from src.ai.utils.state_machine import ModelAccessState
from src.ai.messages.messages import AI_ERRORS, SETTINGS_ERRORS
from src.ai.utils.cache import AICacheKeys, AICacheManager


class UnifiedAIService:
    """
    سرویس واحد برای تمام عملیات AI
    
    این کلاس:
    - از Registry برای دریافت Providerها استفاده می‌کند
    - مدل‌های فعال را از دیتابیس می‌خواند
    - API Key را با اولویت Personal > Shared انتخاب می‌کند
    - Access Control را بررسی می‌کند
    """
    
    @staticmethod
    def _get_active_model(capability: str, provider_slug: Optional[str] = None, model_id: Optional[int] = None) -> AIModel:
        """
        دریافت مدل فعال برای capability مشخص
        
        Args:
            capability: نوع قابلیت ('image', 'content', 'chat', 'audio')
            provider_slug: نام provider (اختیاری - اگر نباشد از اولین مدل فعال استفاده می‌شود)
            model_id: ID مدل از دیتابیس (اختیاری)
            
        Returns:
            مدل فعال
            
        Raises:
            ValueError: اگر مدل فعالی یافت نشد
        """
        if model_id:
            try:
                model = AIModel.objects.select_related('provider').get(
                    id=model_id,
                    is_active=True,
                    provider__is_active=True
                )
                if capability not in model.capabilities:
                    raise ValueError(AI_ERRORS.get("model_no_capability", "Model does not support this capability").format(capability=capability))
                return model
            except AIModel.DoesNotExist:
                raise ValueError(AI_ERRORS.get("model_not_found", "Model not found"))
        
        if provider_slug:
            model = AIModel.objects.get_active_model(provider_slug, capability)
            if not model:
                raise ValueError(
                    AI_ERRORS.get("no_active_model", "No active model found").format(
                        provider=provider_slug,
                        capability=capability
                    )
                )
            return model
        
        # اگر provider مشخص نشد، از اولین مدل فعال استفاده می‌کنیم
        models = AIModel.objects.get_models_by_capability(capability, include_inactive=False)
        if not models:
            raise ValueError(
                AI_ERRORS.get("no_active_model_any_provider", "No active model found").format(
                    capability=capability
                )
            )
        
        return models[0]
    
    @staticmethod
    def _check_access(model: AIModel, admin) -> ModelAccessState:
        """
        بررسی دسترسی ادمین به مدل
        
        Args:
            model: مدل AI
            admin: کاربر ادمین
            
        Returns:
            وضعیت دسترسی
        """
        return ModelAccessState.calculate(model.provider, model, admin)
    
    @staticmethod
    def _get_api_key(provider: AIProvider, admin) -> str:
        """
        دریافت API Key با اولویت: Personal > Shared
        
        Args:
            provider: Provider
            admin: کاربر ادمین
            
        Returns:
            API Key
            
        Raises:
            ValueError: اگر API Key موجود نباشد
        """
        # اولویت 1: Personal API Key
        if admin:
            try:
                settings = AdminProviderSettings.objects.get(
                    admin=admin,
                    provider=provider,
                    is_active=True
                )
                personal_key = settings.get_personal_api_key()
                if personal_key and personal_key.strip():
                    return personal_key
            except AdminProviderSettings.DoesNotExist:
                pass
        
        # اولویت 2: Shared API Key
        is_super = getattr(admin, 'is_superuser', False) or getattr(admin, 'is_admin_full', False)
        
        if not is_super:
            if not provider.allow_shared_for_normal_admins:
                raise ValueError(
                    SETTINGS_ERRORS.get("shared_api_not_allowed", "Shared API not allowed").format(
                        provider_name=provider.display_name
                    )
                )
        
        shared_key = provider.get_shared_api_key()
        if not shared_key or not shared_key.strip():
            raise ValueError(
                SETTINGS_ERRORS.get("no_api_key_available", "No API key available").format(
                    provider_name=provider.display_name
                )
            )
        
        return shared_key
    
    @staticmethod
    def _get_provider_instance(model: AIModel, admin) -> Any:
        """
        ایجاد instance از Provider
        
        Args:
            model: مدل AI
            admin: کاربر ادمین
            
        Returns:
            Instance از Provider
        """
        provider = model.provider
        api_key = UnifiedAIService._get_api_key(provider, admin)
        
        config = provider.config.copy() if provider.config else {}
        config['model'] = model.model_id
        
        return get_provider_instance(provider.slug, api_key, config)
    
    @staticmethod
    async def _execute_async(operation: str, provider_instance: Any, **kwargs) -> Any:
        """
        اجرای عملیات async
        
        Args:
            operation: نام عملیات ('generate_image', 'generate_content', 'chat', 'text_to_speech')
            provider_instance: Instance از Provider
            **kwargs: پارامترهای عملیات
            
        Returns:
            نتیجه عملیات
        """
        if not hasattr(provider_instance, operation):
            raise ValueError(
                AI_ERRORS.get("operation_not_supported", "Operation not supported").format(
                    operation=operation,
                    provider=provider_instance.get_provider_name()
                )
            )
        
        method = getattr(provider_instance, operation)
        return await method(**kwargs)
    
    @staticmethod
    def _increment_usage(model: AIModel, admin):
        """
        افزایش آمار استفاده
        
        Args:
            model: مدل AI
            admin: کاربر ادمین
        """
        model.increment_usage()
        model.provider.increment_usage()
        
        if admin:
            try:
                settings = AdminProviderSettings.objects.get(
                    admin=admin,
                    provider=model.provider,
                    is_active=True
                )
                settings.increment_usage()
            except AdminProviderSettings.DoesNotExist:
                pass
    
    @classmethod
    def generate_image(
        cls,
        prompt: str,
        admin,
        model_id: Optional[int] = None,
        provider_slug: Optional[str] = None,
        size: Optional[str] = None,
        quality: Optional[str] = None,
        **kwargs
    ) -> BytesIO:
        """
        تولید تصویر
        
        Args:
            prompt: متن درخواست
            admin: کاربر ادمین
            model_id: ID مدل (اختیاری)
            provider_slug: نام provider (اختیاری)
            size: اندازه تصویر (مثل '1024x1024')
            quality: کیفیت تصویر (مثل 'hd', 'standard')
            **kwargs: پارامترهای اضافی
            
        Returns:
            BytesIO از تصویر
        """
        model = cls._get_active_model('image', provider_slug, model_id)
        
        # بررسی دسترسی
        access_state = cls._check_access(model, admin)
        if access_state not in [ModelAccessState.AVAILABLE_SHARED, ModelAccessState.AVAILABLE_PERSONAL]:
            raise ValueError(AI_ERRORS.get("model_access_denied", "Access denied"))
        
        # ایجاد provider instance
        provider_instance = cls._get_provider_instance(model, admin)
        
        # اجرای عملیات
        try:
            loop = asyncio.get_event_loop()
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
        
        try:
            image_kwargs = {'prompt': prompt}
            if size:
                image_kwargs['size'] = size
            if quality:
                image_kwargs['quality'] = quality
            image_kwargs.update(kwargs)
            
            image_bytes = loop.run_until_complete(
                cls._execute_async('generate_image', provider_instance, **image_kwargs)
            )
            
            # افزایش آمار
            cls._increment_usage(model, admin)
            
            return image_bytes
        finally:
            loop.run_until_complete(provider_instance.close())
    
    @classmethod
    def generate_content(
        cls,
        topic: str,
        admin,
        model_id: Optional[int] = None,
        provider_slug: Optional[str] = None,
        word_count: Optional[int] = None,
        tone: Optional[str] = None,
        keywords: Optional[List[str]] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """
        تولید محتوا
        
        Args:
            topic: موضوع محتوا
            admin: کاربر ادمین
            model_id: ID مدل (اختیاری)
            provider_slug: نام provider (اختیاری)
            word_count: تعداد کلمات
            tone: سبک نوشتاری
            keywords: کلمات کلیدی
            **kwargs: پارامترهای اضافی
            
        Returns:
            Dictionary شامل محتوا
        """
        model = cls._get_active_model('content', provider_slug, model_id)
        
        # بررسی دسترسی
        access_state = cls._check_access(model, admin)
        if access_state not in [ModelAccessState.AVAILABLE_SHARED, ModelAccessState.AVAILABLE_PERSONAL]:
            raise ValueError(AI_ERRORS.get("model_access_denied", "Access denied"))
        
        # ایجاد provider instance
        provider_instance = cls._get_provider_instance(model, admin)
        
        # اجرای عملیات
        try:
            loop = asyncio.get_event_loop()
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
        
        try:
            content_kwargs = {'prompt': topic}
            if word_count:
                content_kwargs['word_count'] = word_count
            if tone:
                content_kwargs['tone'] = tone
            if keywords:
                content_kwargs['keywords'] = keywords
            content_kwargs.update(kwargs)
            
            content = loop.run_until_complete(
                cls._execute_async('generate_seo_content', provider_instance, **content_kwargs)
            )
            
            # افزایش آمار
            cls._increment_usage(model, admin)
            
            return content
        finally:
            loop.run_until_complete(provider_instance.close())
    
    @classmethod
    def chat(
        cls,
        message: str,
        admin,
        model_id: Optional[int] = None,
        provider_slug: Optional[str] = None,
        conversation_history: Optional[List[Dict[str, str]]] = None,
        system_message: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        **kwargs
    ) -> str:
        """
        چت با AI
        
        Args:
            message: پیام کاربر
            admin: کاربر ادمین
            model_id: ID مدل (اختیاری)
            provider_slug: نام provider (اختیاری)
            conversation_history: تاریخچه گفتگو
            system_message: پیام سیستم
            temperature: دما (0-1)
            max_tokens: حداکثر تعداد توکن
            **kwargs: پارامترهای اضافی
            
        Returns:
            پاسخ AI
        """
        model = cls._get_active_model('chat', provider_slug, model_id)
        
        # بررسی دسترسی
        access_state = cls._check_access(model, admin)
        if access_state not in [ModelAccessState.AVAILABLE_SHARED, ModelAccessState.AVAILABLE_PERSONAL]:
            raise ValueError(AI_ERRORS.get("model_access_denied", "Access denied"))
        
        # ایجاد provider instance
        provider_instance = cls._get_provider_instance(model, admin)
        
        # اجرای عملیات
        try:
            loop = asyncio.get_event_loop()
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
        
        try:
            chat_kwargs = {
                'message': message,
                'conversation_history': conversation_history or []
            }
            if system_message:
                chat_kwargs['system_message'] = system_message
            if temperature is not None:
                chat_kwargs['temperature'] = temperature
            if max_tokens:
                chat_kwargs['max_tokens'] = max_tokens
            chat_kwargs.update(kwargs)
            
            reply = loop.run_until_complete(
                cls._execute_async('chat', provider_instance, **chat_kwargs)
            )
            
            # افزایش آمار
            cls._increment_usage(model, admin)
            
            return reply
        finally:
            loop.run_until_complete(provider_instance.close())
    
    @classmethod
    def text_to_speech(
        cls,
        text: str,
        admin,
        model_id: Optional[int] = None,
        provider_slug: Optional[str] = None,
        voice: Optional[str] = None,
        speed: Optional[float] = None,
        **kwargs
    ) -> BytesIO:
        """
        تبدیل متن به گفتار
        
        Args:
            text: متن
            admin: کاربر ادمین
            model_id: ID مدل (اختیاری)
            provider_slug: نام provider (اختیاری)
            voice: صدا (مثل 'alloy', 'echo')
            speed: سرعت (0.25-4.0)
            **kwargs: پارامترهای اضافی
            
        Returns:
            BytesIO از فایل صوتی
        """
        model = cls._get_active_model('text_to_speech', provider_slug, model_id)
        
        # بررسی دسترسی
        access_state = cls._check_access(model, admin)
        if access_state not in [ModelAccessState.AVAILABLE_SHARED, ModelAccessState.AVAILABLE_PERSONAL]:
            raise ValueError(AI_ERRORS.get("model_access_denied", "Access denied"))
        
        # ایجاد provider instance
        provider_instance = cls._get_provider_instance(model, admin)
        
        # اجرای عملیات
        try:
            loop = asyncio.get_event_loop()
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
        
        try:
            tts_kwargs = {'text': text}
            if voice:
                tts_kwargs['voice'] = voice
            if speed is not None:
                tts_kwargs['speed'] = speed
            tts_kwargs.update(kwargs)
            
            audio_bytes = loop.run_until_complete(
                cls._execute_async('text_to_speech', provider_instance, **tts_kwargs)
            )
            
            # افزایش آمار
            cls._increment_usage(model, admin)
            
            return audio_bytes
        finally:
            loop.run_until_complete(provider_instance.close())
    
    @classmethod
    def get_available_models(cls, capability: str, admin) -> List[Dict[str, Any]]:
        """
        دریافت لیست مدل‌های قابل دسترس برای کاربر
        
        Args:
            capability: نوع قابلیت ('image', 'content', 'chat', 'audio')
            admin: کاربر ادمین
            
        Returns:
            لیست مدل‌های قابل دسترس
        """
        models = AIModel.objects.get_models_by_capability(capability, include_inactive=False)
        
        result = []
        for model in models:
            access_state = cls._check_access(model, admin)
            
            if access_state == ModelAccessState.DISABLED:
                continue
            
            result.append({
                'id': model.id,
                'name': model.display_name,
                'model_id': model.model_id,
                'provider': {
                    'slug': model.provider.slug,
                    'name': model.provider.display_name
                },
                'capabilities': model.capabilities,
                'is_active': model.is_active,
                'is_free': model.pricing_input is None and model.pricing_output is None,
                'access_state': access_state.value,
                'pricing': {
                    'input': float(model.pricing_input) if model.pricing_input else None,
                    'output': float(model.pricing_output) if model.pricing_output else None,
                },
                'limits': {
                    'max_tokens': model.max_tokens,
                    'context_window': model.context_window,
                }
            })
        
        return result

