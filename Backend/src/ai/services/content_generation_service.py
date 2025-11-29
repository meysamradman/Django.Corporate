import asyncio
import time
from typing import Dict, Any, Optional
from django.utils.text import slugify
from src.ai.models import AIProvider, AdminProviderSettings
from src.ai.providers import GeminiProvider, OpenAIProvider, HuggingFaceProvider, DeepSeekProvider, OpenRouterProvider


class AIContentGenerationService:
    """Service for AI content generation - generates content without caching"""
    
    PROVIDER_MAP = {
        'gemini': GeminiProvider,
        'openai': OpenAIProvider,
        'deepseek': DeepSeekProvider,
        'openrouter': OpenRouterProvider,
        # Note: Hugging Face Inference API has limitations for text generation (404 errors)
        # 'huggingface': HuggingFaceProvider,  # Disabled due to API limitations
    }
    
    @classmethod
    def get_provider(cls, provider_name: str, admin=None):
        """
        ✅ Get AI provider instance using new dynamic system
        
        Args:
            provider_name: Provider slug ('gemini', 'openai', 'deepseek')
            admin: Admin user instance (optional)
        
        Returns:
            Provider instance with appropriate API key
        """
        provider_class = cls.PROVIDER_MAP.get(provider_name)
        if not provider_class:
            raise ValueError(f"Provider '{provider_name}' پشتیبانی نمی‌شود.")
        
        import logging
        logger = logging.getLogger(__name__)
        
        # Get provider from database
        provider = AIProvider.get_provider_by_slug(provider_name)
        if not provider:
            raise ValueError(f"Provider '{provider_name}' فعال نیست یا یافت نشد.")
        
        # ✅ Determine which API key to use
        if admin and hasattr(admin, 'user_type') and admin.user_type == 'admin':
            try:
                # Check if admin has personal settings
                settings = AdminProviderSettings.objects.get(
                    admin=admin,
                    provider=provider,
                    is_active=True
                )
                
                if settings.use_shared_api:
                    logger.info(f"🔗 [AI Content Service] Using SHARED API")
                    api_key = provider.get_shared_api_key()
                else:
                    logger.info(f"👤 [AI Content Service] Using PERSONAL API")
                    api_key = settings.get_personal_api_key()
                    
            except AdminProviderSettings.DoesNotExist:
                # No personal settings → use shared
                logger.info(f"🔗 [AI Content Service] Using SHARED API (no personal settings)")
                api_key = provider.get_shared_api_key()
        else:
            # No admin → use shared
            logger.info(f"🔗 [AI Content Service] Using SHARED API (no admin)")
            api_key = provider.get_shared_api_key()
        
        config = provider.config or {}
        return provider_class(api_key=api_key, config=config)
    
    @classmethod
    def generate_content(cls, topic: str, provider_name: str = 'gemini', admin=None, **kwargs) -> Dict[str, Any]:
        """
        Generate SEO-optimized content (without caching)
        
        Args:
            topic: Content topic/subject
            provider_name: AI provider ('gemini', 'openai', or 'deepseek')
            **kwargs: Additional settings:
                - word_count: Target word count (default: 500)
                - tone: Content tone (default: 'professional')
                - keywords: List of keywords (optional)
        
        Returns:
            Dict with SEO-optimized content structure
        """
        word_count = kwargs.get('word_count', 500)
        tone = kwargs.get('tone', 'professional')
        keywords = kwargs.get('keywords', [])
        
        # Generate new content
        start_time = time.time()
        
        try:
            provider = cls.get_provider(provider_name, admin=admin)
            
            # Use async generation
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
            
            # Calculate generation time
            generation_time_ms = int((time.time() - start_time) * 1000)
            
            # Ensure required fields
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
                # Approximate word count
                content_text = seo_data.get('content', '')
                seo_data['word_count'] = len(content_text.split())
            
            # ✅ Track usage
            if admin and hasattr(admin, 'user_type') and admin.user_type == 'admin':
                try:
                    settings = AdminProviderSettings.objects.get(
                        admin=admin,
                        provider=provider,
                        is_active=True
                    )
                    # Track based on which API is used
                    if settings.use_shared_api:
                        provider.increment_usage()
                    else:
                        settings.increment_usage()
                except AdminProviderSettings.DoesNotExist:
                    # No settings → track on provider
                    provider.increment_usage()
            else:
                # No admin → track on provider
                provider.increment_usage()
            
            # Format and return response
            return {
                'title': seo_data['title'],
                'meta_title': seo_data['meta_title'],
                'meta_description': seo_data['meta_description'],
                'slug': seo_data['slug'],
                'h1': seo_data.get('h1', seo_data['title']),
                'content': seo_data['content'],  # HTML content with <p>, <h2>, <h3> tags
                'keywords': seo_data.get('keywords', []),
                'word_count': seo_data.get('word_count', 0),
                'provider_name': provider_name,
                'generation_time_ms': generation_time_ms,
            }
            
        except ValueError as e:
            raise e
        except Exception as e:
            raise Exception(f"خطا در تولید محتوا: {str(e)}")
    
    @classmethod
    def get_available_providers(cls, admin=None) -> list:
        """
        ✅ Get list of available content generation providers
        
        Returns:
            List of providers that admin can use
        """
        import logging
        logger = logging.getLogger(__name__)
        
        try:
            # Get all active providers
            providers = AIProvider.get_active_providers()
            
            result = []
            for provider in providers:
                # Check if provider is in supported list
                if provider.slug not in cls.PROVIDER_MAP:
                    continue
                
                result.append({
                    'id': provider.id,
                    'provider_name': provider.slug,
                    'provider_display': provider.display_name,
                    'can_generate': True
                })
            
            logger.info(f"[AI Content] Returning {len(result)} providers")
            return result
        except Exception as e:
            logger.error(f"[AI Content] Error: {str(e)}")
            return []
    
    @classmethod
    def _get_provider_display(cls, provider_name: str) -> str:
        """Get display name for provider"""
        display_names = {
            'gemini': 'Google Gemini',
            'openai': 'OpenAI GPT',
            'deepseek': 'DeepSeek AI',
            'openrouter': 'OpenRouter (60+ Providers)',
            'huggingface': 'Hugging Face',
        }
        return display_names.get(provider_name, provider_name)

