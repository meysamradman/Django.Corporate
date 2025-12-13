import asyncio
import time
from typing import Dict, Any, Optional, List
from src.ai.models import AIProvider, AdminProviderSettings, AIModel
from src.ai.providers import GeminiProvider, OpenAIProvider, DeepSeekProvider, OpenRouterProvider, GroqProvider, HuggingFaceProvider
from src.ai.messages.messages import CHAT_ERRORS, SETTINGS_ERRORS, AI_ERRORS
from src.ai.providers.capabilities import ProviderAvailabilityManager


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
    def get_provider(cls, provider_name: str, admin=None, model_name: Optional[str] = None):
        """
        Get provider instance with API key.
        Now supports selecting specific model or auto-selecting active model.
        """
        provider_class = cls.PROVIDER_MAP.get(provider_name)
        if not provider_class:
            raise ValueError(CHAT_ERRORS["provider_not_supported"].format(provider_name=provider_name))
        
        try:
            provider = AIProvider.objects.get(slug=provider_name, is_active=True)
        except AIProvider.DoesNotExist:
            raise ValueError(CHAT_ERRORS["provider_not_supported"].format(provider_name=provider_name))
        
        # Get active model for this capability if not specified
        if not model_name:
            active_model = AIModel.objects.get_active_model(provider_name, 'chat')
            if active_model:
                model_name = active_model.model_id
        
        if admin and hasattr(admin, 'user_type') and admin.user_type == 'admin':
            settings = AdminProviderSettings.objects.filter(
                admin=admin,
                provider=provider,
                is_active=True
            ).first()
            
            if settings:
                # اولویت: 1) Personal API Key  2) Shared API Key
                api_key = settings.get_personal_api_key()
                if not api_key or not api_key.strip():
                    # اگر Personal نبود، از Shared استفاده کن
                    api_key = provider.get_shared_api_key()
                    if not api_key or not api_key.strip():
                        raise ValueError(SETTINGS_ERRORS["shared_api_key_not_set"].format(provider_name=provider.display_name))
            else:
                # اگر settings نداشت، از Shared استفاده کن
                api_key = provider.get_shared_api_key()
                if not api_key or not api_key.strip():
                    raise ValueError(SETTINGS_ERRORS["shared_api_key_not_set"].format(provider_name=provider.display_name))
        else:
            api_key = provider.get_shared_api_key()
            if not api_key or not api_key.strip():
                raise ValueError(SETTINGS_ERRORS["shared_api_key_not_set"].format(provider_name=provider.display_name))
        
        config = provider.config or {}
        if model_name:
            config['model'] = model_name
        
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
            raise Exception(AI_ERRORS["chat_failed"].format(error=str(e)))
    
    @classmethod
    def get_available_providers(cls, admin=None) -> list:
        all_providers = ProviderAvailabilityManager.get_available_providers('chat')
        return [p for p in all_providers if p['provider_name'] in cls.PROVIDER_MAP]

