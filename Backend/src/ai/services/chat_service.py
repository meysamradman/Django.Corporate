import asyncio
import time
from typing import Dict, Any, Optional, List
from src.ai.models.image_generation import AIImageGeneration
from src.ai.providers import GeminiProvider, OpenAIProvider, DeepSeekProvider


class AIChatService:
    """Service for AI chat - simple chat without database storage"""
    
    PROVIDER_MAP = {
        'gemini': GeminiProvider,
        'openai': OpenAIProvider,
        'deepseek': DeepSeekProvider,
    }
    
    @classmethod
    def get_provider(cls, provider_name: str):
        """Get AI provider instance"""
        provider_model = AIImageGeneration.objects.filter(
            provider_name=provider_name,
            is_active=True
        ).first()
        
        if not provider_model:
            raise ValueError(f"Provider '{provider_name}' فعال نیست یا یافت نشد.")
        
        provider_class = cls.PROVIDER_MAP.get(provider_name)
        if not provider_class:
            raise ValueError(f"Provider '{provider_name}' پشتیبانی نمی‌شود.")
        
        api_key = provider_model.get_api_key()
        config = provider_model.config or {}
        
        return provider_class(api_key=api_key, config=config)
    
    @classmethod
    def chat(
        cls,
        message: str,
        provider_name: str = 'gemini',
        conversation_history: Optional[List[Dict[str, str]]] = None,
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
            provider = cls.get_provider(provider_name)
            
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
    def get_available_providers(cls) -> list:
        """Get list of available chat providers"""
        providers = AIImageGeneration.objects.filter(
            provider_name__in=['gemini', 'openai', 'deepseek'],
            is_active=True
        ).values('id', 'provider_name')
        
        result = []
        for provider in providers:
            result.append({
                'id': provider['id'],
                'provider_name': provider['provider_name'],
                'provider_display': cls._get_provider_display(provider['provider_name']),
                'can_chat': True
            })
        
        return result
    
    @classmethod
    def _get_provider_display(cls, provider_name: str) -> str:
        """Get display name for provider"""
        display_names = {
            'gemini': 'Google Gemini',
            'openai': 'OpenAI GPT',
            'deepseek': 'DeepSeek AI',
        }
        return display_names.get(provider_name, provider_name)

