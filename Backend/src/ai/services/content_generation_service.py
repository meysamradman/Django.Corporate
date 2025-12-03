import asyncio
import time
from typing import Dict, Any, Optional
from django.utils.text import slugify
from src.ai.models import AIProvider, AdminProviderSettings
from src.ai.providers import GeminiProvider, OpenAIProvider, HuggingFaceProvider, DeepSeekProvider, OpenRouterProvider, GroqProvider
from src.ai.messages.messages import AI_ERRORS, SETTINGS_ERRORS
from src.ai.providers.capabilities import ProviderAvailabilityManager


class AIContentGenerationService:
    
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
        provider_class = cls.PROVIDER_MAP.get(provider_name)
        if not provider_class:
            raise ValueError(AI_ERRORS["provider_not_supported"].format(provider_name=provider_name))
        
        provider = AIProvider.get_provider_by_slug(provider_name)
        if not provider:
            raise ValueError(AI_ERRORS["provider_not_available"].format(provider_name=provider_name))
        
        if admin and hasattr(admin, 'user_type') and admin.user_type == 'admin':
            try:
                settings = AdminProviderSettings.objects.get(
                    admin=admin,
                    provider=provider,
                    is_active=True
                )
                
                if settings.use_shared_api:
                    api_key = provider.get_shared_api_key()
                    if not api_key or not api_key.strip():
                        api_key = settings.get_personal_api_key()
                        if not api_key or not api_key.strip():
                            raise ValueError(SETTINGS_ERRORS.get("shared_api_key_not_set", "API Key not set").format(provider_name=provider_name))
                else:
                    api_key = settings.get_personal_api_key()
                    if not api_key or not api_key.strip():
                        raise ValueError(SETTINGS_ERRORS.get("personal_api_key_not_set", "Personal API Key not set").format(provider_name=provider_name))
                    
            except AdminProviderSettings.DoesNotExist:
                api_key = provider.get_shared_api_key()
                if not api_key or not api_key.strip():
                    raise ValueError(SETTINGS_ERRORS.get("shared_api_key_not_set", "Shared API Key not set").format(provider_name=provider_name))
        else:
            api_key = provider.get_shared_api_key()
            if not api_key or not api_key.strip():
                raise ValueError(SETTINGS_ERRORS.get("shared_api_key_not_set", "Shared API Key not set").format(provider_name=provider_name))
        
        config = provider.config or {}
        return provider_class(api_key=api_key, config=config)
    
    @classmethod
    def generate_content(cls, topic: str, provider_name: str = 'gemini', admin=None, **kwargs) -> Dict[str, Any]:
        word_count = kwargs.get('word_count', 500)
        tone = kwargs.get('tone', 'professional')
        keywords = kwargs.get('keywords', [])
        
        start_time = time.time()
        
        try:
            provider = cls.get_provider(provider_name, admin=admin)
            
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                seo_data = loop.run_until_complete(
                    provider.generate_seo_content(
                        topic=topic,
                        word_count=word_count,
                        tone=tone,
                        keywords=keywords
                    )
                )
            finally:
                loop.close()
            
            generation_time_ms = int((time.time() - start_time) * 1000)
            
            if 'title' not in seo_data:
                seo_data['title'] = topic
            if 'meta_title' not in seo_data:
                seo_data['meta_title'] = seo_data.get('title', topic)[:60]
            if 'meta_description' not in seo_data:
                seo_data['meta_description'] = seo_data.get('content', '')[:160]
            if 'slug' not in seo_data:
                seo_data['slug'] = slugify(seo_data.get('title', topic))
            if 'h1' not in seo_data:
                seo_data['h1'] = seo_data.get('title', topic)
            if 'keywords' not in seo_data:
                seo_data['keywords'] = keywords if keywords else []
            if 'word_count' not in seo_data:
                content_text = seo_data.get('content', '')
                seo_data['word_count'] = len(content_text.split())
            
            if admin and hasattr(admin, 'user_type') and admin.user_type == 'admin':
                try:
                    settings = AdminProviderSettings.objects.get(
                        admin=admin,
                        provider=provider,
                        is_active=True
                    )
                    if settings.use_shared_api:
                        provider.increment_usage()
                    else:
                        settings.increment_usage()
                except AdminProviderSettings.DoesNotExist:
                    provider.increment_usage()
            else:
                provider.increment_usage()
            
            return {
                'title': seo_data['title'],
                'meta_title': seo_data['meta_title'],
                'meta_description': seo_data['meta_description'],
                'slug': seo_data['slug'],
                'h1': seo_data.get('h1', seo_data['title']),
                'content': seo_data['content'],
                'keywords': seo_data.get('keywords', []),
                'word_count': seo_data.get('word_count', 0),
                'provider_name': provider_name,
                'generation_time_ms': generation_time_ms,
            }
            
        except ValueError as e:
            raise e
        except Exception as e:
            raise Exception(AI_ERRORS["content_generation_failed"].format(error=str(e)))
    
    @classmethod
    def get_available_providers(cls, admin=None) -> list:
        return ProviderAvailabilityManager.get_available_providers('content')

