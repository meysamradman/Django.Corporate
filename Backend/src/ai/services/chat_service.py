import asyncio
import time
import asyncio
from typing import Dict, Any, Optional, List
from src.ai.models import AIProvider, AdminProviderSettings
from src.ai.providers import GeminiProvider, OpenAIProvider, DeepSeekProvider, OpenRouterProvider, GroqProvider, HuggingFaceProvider


class AIChatService:
    
    PROVIDER_MAP = {
        'gemini': GeminiProvider,
        'openai': OpenAIProvider,
        'deepseek': DeepSeekProvider,
        'openrouter': OpenRouterProvider,
        'groq': GroqProvider,
        'huggingface': HuggingFaceProvider,
    }
    
    @classmethod
    def get_provider(cls, provider_name: str, admin=None):
        import logging
        logger = logging.getLogger(__name__)
        
        provider_class = cls.PROVIDER_MAP.get(provider_name)
        if not provider_class:
            raise ValueError(f"Provider '{provider_name}' پشتیبانی نمی‌شود.")
        
        # ✅ Get provider from database
        try:
            provider = AIProvider.objects.get(slug=provider_name, is_active=True)
        except AIProvider.DoesNotExist:
            raise ValueError(f"Provider '{provider_name}' یافت نشد یا غیرفعال است.")
        
        # ✅ Get appropriate API key
        if admin and hasattr(admin, 'user_type') and admin.user_type == 'admin':
            settings = AdminProviderSettings.objects.filter(
                admin=admin,
                provider=provider,
                is_active=True
            ).first()
            
            if settings:
                try:
                    api_key = settings.get_api_key()
                    api_type = 'SHARED' if settings.use_shared_api else 'PERSONAL'
                    admin_id = getattr(admin, 'id', 'unknown')
                    logger.info(f"✅ [Chat Service] Admin {admin_id} using {api_type} API for {provider_name} (use_shared_api={settings.use_shared_api})")
                except Exception as e:
                    # If get_api_key() fails (e.g., shared key not set), try fallback
                    logger.warning(f"⚠️ [Chat Service] get_api_key() failed: {e}")
                    if settings.use_shared_api:
                        # Try personal key as fallback
                        try:
                            api_key = settings.get_personal_api_key()
                            if api_key and api_key.strip():
                                logger.info(f"✅ [Chat Service] Fallback: Using personal API key for {provider_name}")
                            else:
                                # Try shared provider key
                                api_key = provider.get_shared_api_key()
                                if not api_key or not api_key.strip():
                                    raise ValueError(f"API Key برای {provider_name} تنظیم نشده است. لطفاً در تنظیمات AI یک API Key اضافه کنید.")
                        except Exception:
                            # Final fallback: shared provider key
                            api_key = provider.get_shared_api_key()
                            if not api_key or not api_key.strip():
                                raise ValueError(f"API Key برای {provider_name} تنظیم نشده است. لطفاً در تنظیمات AI یک API Key اضافه کنید.")
                    else:
                        # use_shared_api=False, so personal key should work
                        api_key = settings.get_personal_api_key()
                        if not api_key or not api_key.strip():
                            raise ValueError(f"API Key شخصی برای {provider_name} تنظیم نشده است. لطفاً در تنظیمات AI یک API Key اضافه کنید.")
            else:
                api_key = provider.get_shared_api_key()
                if not api_key or not api_key.strip():
                    raise ValueError(f"API Key مشترک برای {provider_name} تنظیم نشده است. لطفاً در تنظیمات AI یک API Key اضافه کنید.")
                admin_id = getattr(admin, 'id', 'unknown') if admin else 'unknown'
                logger.info(f"✅ [Chat Service] Admin {admin_id} using SHARED API for {provider_name} (no personal settings)")
        else:
            api_key = provider.get_shared_api_key()
            if not api_key or not api_key.strip():
                raise ValueError(f"API Key مشترک برای {provider_name} تنظیم نشده است. لطفاً در تنظیمات AI یک API Key اضافه کنید.")
            logger.info(f"🔗 Using shared API for {provider_name} (no admin)")
        
        config = provider.config or {}
        
        return provider_class(api_key=api_key, config=config)
    
    @classmethod
    def chat(
        cls,
        message: str,
        provider_name: str = 'gemini',
        conversation_history: Optional[List[Dict[str, str]]] = None,
        admin=None,
        **kwargs
    ) -> Dict[str, Any]:
        start_time = time.time()
        
        try:
            provider = cls.get_provider(provider_name, admin=admin)
            
            # Get AI response
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            
            try:
                reply = loop.run_until_complete(
                    provider.chat(
                        message=message,
                        conversation_history=conversation_history or [],
                        temperature=kwargs.get('temperature', 0.7),
                        max_tokens=kwargs.get('max_tokens', 2048),
                        system_message=kwargs.get('system_message'),
                        # Model will be read from config in OpenRouterProvider.__init__
                    )
                )
            finally:
                loop.close()
            
            generation_time_ms = int((time.time() - start_time) * 1000)
            
            return {
                'message': message,
                'reply': reply,
                'provider_name': provider_name,
                'generation_time_ms': generation_time_ms,
            }
            
        except Exception as e:
            raise Exception(f"خطا در چت: {str(e)}")
    
    @classmethod
    def get_available_providers(cls, admin=None) -> list:
        from src.ai.providers.capabilities import ProviderAvailabilityManager
        all_providers = ProviderAvailabilityManager.get_available_providers('chat')
        # Filter based on PROVIDER_MAP
        return [p for p in all_providers if p['provider_name'] in cls.PROVIDER_MAP]

