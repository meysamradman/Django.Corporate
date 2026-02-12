import asyncio
import time
from typing import Dict, Any, Optional, List
from src.ai.models import AIProvider, AdminProviderSettings, AICapabilityModel
from src.ai.providers.registry import AIProviderRegistry
from src.ai.messages.messages import CHAT_ERRORS, SETTINGS_ERRORS, AI_ERRORS
from src.ai.providers.capabilities import ProviderAvailabilityManager
from src.ai.providers.capabilities import get_default_model

class AIChatService:
    
    @classmethod
    def get_provider(cls, provider_name: Optional[str], admin=None, model_name: Optional[str] = None):
        """
        Returns tuple: (provider_instance, provider_model, model_name)
        """
        import logging
        logger = logging.getLogger(__name__)

        provider_name = (provider_name or '').strip().lower() or None
        
        explicit_model = bool(model_name and str(model_name).strip())

        capability = 'chat'

        if not provider_name:
            cm = AICapabilityModel.objects.get_active(capability)
            if not cm:
                raise ValueError(
                    AI_ERRORS.get('no_active_model_any_provider').format(capability=capability)
                )
            provider_name = cm.provider.slug
            if not explicit_model:
                model_name = cm.model_id
        else:
            if not explicit_model:
                cm = (
                    AICapabilityModel.objects.filter(
                        capability=capability,
                        provider__slug=provider_name,
                        provider__is_active=True,
                    )
                    .select_related('provider')
                    .order_by('sort_order', 'id')
                    .first()
                )
                if cm:
                    model_name = cm.model_id
                else:
                    provider_model = AIProvider.get_provider_by_slug(provider_name)
                    default_model_id = get_default_model(provider_name, capability)
                    if default_model_id:
                        model_name = default_model_id
                    else:
                        static_models = provider_model.get_static_models(capability) if provider_model else []
                        if not static_models:
                            raise ValueError(AI_ERRORS.get('no_active_model'))
                        model_name = static_models[0]
        
        logger.info(f"[ChatService] Getting provider: {provider_name}, model_name={model_name}")
        
        provider_class = AIProviderRegistry.get(provider_name)
        if not provider_class:
            raise ValueError(CHAT_ERRORS["provider_not_supported"].format(provider_name=provider_name))
        
        try:
            provider_model = AIProvider.objects.get(slug=provider_name, is_active=True)
            logger.info(f"[ChatService] Found provider in DB: {provider_model.display_name}")
        except AIProvider.DoesNotExist:
            logger.error(f"[ChatService] Provider {provider_name} not found in DB!")
            raise ValueError(CHAT_ERRORS["provider_not_supported"].format(provider_name=provider_name))
        
        if admin and hasattr(admin, 'user_type') and admin.user_type == 'admin':
            settings = AdminProviderSettings.objects.filter(
                admin=admin,
                provider=provider_model,
                is_active=True
            ).first()
            
            if settings:
                api_key = settings.get_personal_api_key()
                if not api_key or not api_key.strip():
                    api_key = provider_model.get_shared_api_key()
                    if not api_key or not api_key.strip():
                        raise ValueError(SETTINGS_ERRORS["shared_api_key_not_set"].format(provider_name=provider_model.display_name))
            else:
                api_key = provider_model.get_shared_api_key()
                if not api_key or not api_key.strip():
                    raise ValueError(SETTINGS_ERRORS["shared_api_key_not_set"].format(provider_name=provider_model.display_name))
        else:
            api_key = provider_model.get_shared_api_key()
            if not api_key or not api_key.strip():
                raise ValueError(SETTINGS_ERRORS["shared_api_key_not_set"].format(provider_name=provider_model.display_name))
        
        config = provider_model.config or {}
        config['model'] = model_name
        
        provider_instance = provider_class(api_key=api_key, config=config)
        return provider_instance, provider_model, model_name
    
    @classmethod
    def chat(
        cls,
        message: str,
        provider_name: Optional[str] = None,
        conversation_history: Optional[List[Dict[str, str]]] = None,
        admin=None,
        model_name: Optional[str] = None,
        **kwargs
    ) -> Dict[str, Any]:
        start_time = time.time()
        provider_instance = None
        provider_model = None
        
        try:
            provider_name = (provider_name or '').strip().lower() or None
            provider_instance, provider_model, resolved_model_name = cls.get_provider(provider_name, admin=admin, model_name=model_name)
            
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            
            try:
                reply = loop.run_until_complete(
                    provider_instance.chat(
                        message=message,
                        conversation_history=conversation_history or [],
                        temperature=kwargs.get('temperature', 0.7),
                        max_tokens=kwargs.get('max_tokens', 2048),
                        system_message=kwargs.get('system_message'),
                        image=kwargs.get('image'),
                    )
                )
            finally:
                # Properly close the async client
                try:
                    loop.run_until_complete(provider_instance.close())
                except Exception:
                    pass
                loop.close()
            
            generation_time_ms = int((time.time() - start_time) * 1000)
            
            return {
                'message': message,
                'reply': reply,
                'provider_name': provider_name,
                'model_name': resolved_model_name,
                'generation_time_ms': generation_time_ms,
            }
            
        except Exception as e:
            import traceback
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"[ChatService] Error: {type(e).__name__}: {str(e)}")
            logger.debug(traceback.format_exc())
            raise Exception(AI_ERRORS["chat_failed"].format(error=str(e)))
    
    @classmethod
    def get_available_providers(cls, admin=None) -> list:
        all_providers = ProviderAvailabilityManager.get_available_providers('chat')
        registered_providers = AIProviderRegistry.get_registered_names()
        return [p for p in all_providers if p['provider_name'] in registered_providers]

