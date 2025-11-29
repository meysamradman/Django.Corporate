import asyncio
import time
from typing import Dict, Any, Optional, List
from src.ai.models import AIProvider, AdminProviderSettings
from src.ai.providers import GeminiProvider, OpenAIProvider, DeepSeekProvider, OpenRouterProvider


class AIChatService:
    """Service for AI chat - simple chat without database storage"""
    
    PROVIDER_MAP = {
        'gemini': GeminiProvider,
        'openai': OpenAIProvider,
        'deepseek': DeepSeekProvider,
        'openrouter': OpenRouterProvider,
    }
    
    @classmethod
    def get_provider(cls, provider_name: str, admin=None):
        """
        Get AI provider instance using new dynamic system
        """
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
                api_key = settings.get_api_key()
                logger.info(f"🔑 Using {'shared' if settings.use_shared_api else 'personal'} API for {provider_name}")
            else:
                api_key = provider.get_shared_api_key()
                logger.info(f"🔗 Using shared API for {provider_name} (no personal settings)")
        else:
            api_key = provider.get_shared_api_key()
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
        """
        Send a chat message and get AI response
        
        Args:
            message: User's message
            provider_name: AI provider ('gemini' or 'openai')
            conversation_history: Optional list of previous messages [{'role': 'user'|'assistant', 'content': '...'}, ...]
            **kwargs: Additional settings:
                - system_message: Custom system message (optional)
                - temperature: Temperature for generation (default: 0.7)
                - max_tokens: Maximum tokens in response (default: 2048)
        
        Returns:
            Dict with AI response and metadata
        """
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
        """
        Get list of available chat providers using new dynamic system
        """
        import logging
        logger = logging.getLogger(__name__)
        
        # Get providers that support chat capability
        providers = AIProvider.objects.filter(
            is_active=True,
            models__capabilities__contains='chat',
            models__is_active=True
        ).distinct().values('id', 'slug', 'display_name')
        
        logger.info(f"[AI Chat] Active chat providers: {list(providers)}")
        return list(providers)

