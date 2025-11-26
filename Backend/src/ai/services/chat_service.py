import asyncio
import time
from typing import Dict, Any, Optional, List
from src.ai.models.image_generation import AIImageGeneration
from src.ai.models.admin_ai_settings import AdminAISettings
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
        Get AI provider instance
        
        Args:
            provider_name: Provider name ('gemini', 'openai', 'deepseek', 'openrouter')
            admin: Admin user instance (optional) - if provided, uses personal/shared API based on settings
        
        Returns:
            Provider instance with appropriate API key
        """
        import logging
        logger = logging.getLogger(__name__)
        
        provider_class = cls.PROVIDER_MAP.get(provider_name)
        if not provider_class:
            raise ValueError(f"Provider '{provider_name}' پشتیبانی نمی‌شود.")
        
        # ✅ Use admin-specific API key if admin is provided
        if admin and hasattr(admin, 'user_type') and admin.user_type == 'admin':
            try:
                api_key = AdminAISettings.get_api_key_for_admin(admin, provider_name)
                # Get config from shared provider (configs are same) - ✅ Use cached method
                provider_model = AIImageGeneration.get_active_provider(provider_name)
                config = provider_model.config or {} if provider_model else {}
                
                # Check if we got a valid API key
                api_key_preview = api_key[:10] + "..." if api_key and len(api_key) > 10 else "None"
                logger.info(f"[AI Chat Service] Got API key from get_api_key_for_admin for {provider_name}, preview: {api_key_preview}")
                print(f"[AI Chat Service] Got API key from get_api_key_for_admin for {provider_name}, preview: {api_key_preview}")
                
                # Check if personal settings exist and use_shared_api flag
                try:
                    personal_settings = AdminAISettings.objects.get(
                        admin=admin,
                        provider_name=provider_name,
                        is_active=True
                    )
                    if personal_settings.use_shared_api:
                        logger.info(f"🔗 [AI Chat Service] ⚡ FINAL DECISION: Using SHARED API (via personal settings - use_shared_api=True)")
                        print(f"🔗 [AI Chat Service] ⚡ FINAL DECISION: Using SHARED API (via personal settings - use_shared_api=True)")
                    else:
                        logger.info(f"👤 [AI Chat Service] ⚡ FINAL DECISION: Using PERSONAL API (use_shared_api=False)")
                        print(f"👤 [AI Chat Service] ⚡ FINAL DECISION: Using PERSONAL API (use_shared_api=False)")
                except AdminAISettings.DoesNotExist:
                    logger.info(f"🔗 [AI Chat Service] ⚡ FINAL DECISION: Using SHARED API (no personal settings found)")
                    print(f"🔗 [AI Chat Service] ⚡ FINAL DECISION: Using SHARED API (no personal settings found)")
            except AdminAISettings.DoesNotExist:
                # Fallback to shared API - ✅ Use cached method
                logger.info(f"[AI Chat Service] Personal settings not found, falling back to shared API")
                print(f"[AI Chat Service] Personal settings not found, falling back to shared API")
                provider_model = AIImageGeneration.get_active_provider(provider_name)
                if not provider_model:
                    raise ValueError(f"Provider '{provider_name}' فعال نیست یا یافت نشد.")
                api_key = provider_model.get_api_key()
                config = provider_model.config or {}
                
                logger.info(f"[AI Chat Service] Using shared API key for {provider_name}")
                print(f"[AI Chat Service] Using shared API key for {provider_name}")
            except Exception as e:
                # If there's any error getting personal API, fallback to shared
                logger.warning(f"[AI Chat Service] Error getting personal API key: {str(e)}, falling back to shared")
                print(f"[AI Chat Service] Error getting personal API key: {str(e)}, falling back to shared")
                provider_model = AIImageGeneration.get_active_provider(provider_name)
                if not provider_model:
                    raise ValueError(f"Provider '{provider_name}' فعال نیست یا یافت نشد.")
                api_key = provider_model.get_api_key()
                config = provider_model.config or {}
                
                logger.info(f"[AI Chat Service] Using shared API key for {provider_name} (fallback)")
                print(f"[AI Chat Service] Using shared API key for {provider_name} (fallback)")
        else:
            # Use shared API (default) - ✅ Use Model's cached method for better performance
            provider_model = AIImageGeneration.get_active_provider(provider_name)
            if not provider_model:
                raise ValueError(f"Provider '{provider_name}' فعال نیست یا یافت نشد.")
            
            api_key = provider_model.get_api_key()
            config = provider_model.config or {}
            
            logger.info(f"[AI Chat Service] Using shared API key for {provider_name} (no admin provided)")
            print(f"[AI Chat Service] Using shared API key for {provider_name} (no admin provided)")
        
        # Log API key status (without exposing the actual key)
        api_key_preview = api_key[:10] + "..." if api_key and len(api_key) > 10 else "None"
        logger.info(f"[AI Chat Service] API key preview: {api_key_preview}, config: {config}")
        print(f"[AI Chat Service] API key preview: {api_key_preview}, config: {config}")
        
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
        Get list of available chat providers
        Returns providers that are either:
        1. Active in shared settings (AIImageGeneration)
        2. Active in personal settings (AdminAISettings) for the given admin
        """
        import logging
        logger = logging.getLogger(__name__)
        
        try:
            # Get shared active providers
            shared_providers = AIImageGeneration.objects.filter(
                provider_name__in=['gemini', 'openai', 'deepseek', 'openrouter'],
                is_active=True
            ).values('id', 'provider_name')
            
            logger.info(f"[AI Chat] Shared active providers: {list(shared_providers)}")
            print(f"[AI Chat] Shared active providers: {list(shared_providers)}")
            
            # Create a set of provider names from shared providers
            available_provider_names = set(p['provider_name'] for p in shared_providers)
            
            # Get personal active providers for this admin (if admin is provided)
            if admin and hasattr(admin, 'user_type') and admin.user_type == 'admin':
                personal_settings = AdminAISettings.objects.filter(
                    admin=admin,
                    provider_name__in=['gemini', 'openai', 'deepseek', 'openrouter'],
                    is_active=True
                ).values('provider_name')
                
                personal_provider_names = set(p['provider_name'] for p in personal_settings)
                
                logger.info(f"[AI Chat] Personal active providers for {admin}: {personal_provider_names}")
                print(f"[AI Chat] Personal active providers for {admin}: {personal_provider_names}")
                
                # Add personal providers to available list (even if not in shared)
                available_provider_names.update(personal_provider_names)
            
            logger.info(f"[AI Chat] Combined available provider names: {available_provider_names}")
            print(f"[AI Chat] Combined available provider names: {available_provider_names}")
            
            # Build result list
            result = []
            for provider_name in available_provider_names:
                # Try to get shared provider for ID (if exists)
                shared_provider = next((p for p in shared_providers if p['provider_name'] == provider_name), None)
                
                result.append({
                    'id': shared_provider['id'] if shared_provider else None,  # Use shared provider ID if exists
                    'provider_name': provider_name,
                    'provider_display': cls._get_provider_display(provider_name),
                    'can_chat': True
                })
            
            logger.info(f"[AI Chat] Returning {len(result)} providers: {result}")
            print(f"[AI Chat] Returning {len(result)} providers: {result}")
            return result
        except Exception as e:
            logger.error(f"[AI Chat] Error in get_available_providers: {str(e)}", exc_info=True)
            print(f"[AI Chat] Error in get_available_providers: {str(e)}")
            return []
    
    @classmethod
    def _get_provider_display(cls, provider_name: str) -> str:
        """Get display name for provider"""
        display_names = {
            'gemini': 'Google Gemini',
            'openai': 'OpenAI GPT',
            'deepseek': 'DeepSeek AI',
            'openrouter': 'OpenRouter (60+ Providers)',
        }
        return display_names.get(provider_name, provider_name)

