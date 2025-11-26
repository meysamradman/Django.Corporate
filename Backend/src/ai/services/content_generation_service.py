import asyncio
import time
from typing import Dict, Any, Optional
from django.utils.text import slugify
from src.ai.models.image_generation import AIImageGeneration
from src.ai.models.admin_ai_settings import AdminAISettings
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
        Get AI provider instance
        
        Args:
            provider_name: Provider name ('gemini', 'openai', 'deepseek')
            admin: Admin user instance (optional) - if provided, uses personal/shared API based on settings
        
        Returns:
            Provider instance with appropriate API key
        """
        provider_class = cls.PROVIDER_MAP.get(provider_name)
        if not provider_class:
            raise ValueError(f"Provider '{provider_name}' پشتیبانی نمی‌شود.")
        
        import logging
        logger = logging.getLogger(__name__)
        
        # ✅ Use admin-specific API key if admin is provided
        if admin and hasattr(admin, 'user_type') and admin.user_type == 'admin':
            try:
                api_key = AdminAISettings.get_api_key_for_admin(admin, provider_name)
                # Get config from shared provider (configs are same) - ✅ Use cached method
                provider_model = AIImageGeneration.get_active_provider(provider_name)
                config = provider_model.config or {} if provider_model else {}
                
                # Check which API is being used
                try:
                    personal_settings = AdminAISettings.objects.get(
                        admin=admin,
                        provider_name=provider_name,
                        is_active=True
                    )
                    if personal_settings.use_shared_api:
                        logger.info(f"🔗 [AI Content Service] ⚡ FINAL DECISION: Using SHARED API (via personal settings - use_shared_api=True)")
                        print(f"🔗 [AI Content Service] ⚡ FINAL DECISION: Using SHARED API (via personal settings - use_shared_api=True)")
                    else:
                        logger.info(f"👤 [AI Content Service] ⚡ FINAL DECISION: Using PERSONAL API (use_shared_api=False)")
                        print(f"👤 [AI Content Service] ⚡ FINAL DECISION: Using PERSONAL API (use_shared_api=False)")
                except AdminAISettings.DoesNotExist:
                    logger.info(f"🔗 [AI Content Service] ⚡ FINAL DECISION: Using SHARED API (no personal settings found)")
                    print(f"🔗 [AI Content Service] ⚡ FINAL DECISION: Using SHARED API (no personal settings found)")
            except AdminAISettings.DoesNotExist:
                # Fallback to shared API - ✅ Use cached method
                logger.info(f"🔗 [AI Content Service] ⚡ FINAL DECISION: Using SHARED API (fallback)")
                print(f"🔗 [AI Content Service] ⚡ FINAL DECISION: Using SHARED API (fallback)")
                provider_model = AIImageGeneration.get_active_provider(provider_name)
                if not provider_model:
                    raise ValueError(f"Provider '{provider_name}' فعال نیست یا یافت نشد.")
                api_key = provider_model.get_api_key()
                config = provider_model.config or {}
        else:
            # Use shared API (default) - ✅ Use Model's cached method for better performance
            logger.info(f"🔗 [AI Content Service] ⚡ FINAL DECISION: Using SHARED API (no admin provided)")
            print(f"🔗 [AI Content Service] ⚡ FINAL DECISION: Using SHARED API (no admin provided)")
            provider_model = AIImageGeneration.get_active_provider(provider_name)
            if not provider_model:
                raise ValueError(f"Provider '{provider_name}' فعال نیست یا یافت نشد.")
            
            api_key = provider_model.get_api_key()
            config = provider_model.config or {}
        
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
            
            # Track usage: if admin uses personal API, track on AdminAISettings; otherwise on shared provider
            if admin and hasattr(admin, 'user_type') and admin.user_type == 'admin':
                try:
                    admin_settings = AdminAISettings.objects.get(
                        admin=admin,
                        provider_name=provider_name,
                        is_active=True
                    )
                    # Only track if using personal API (not shared)
                    if not admin_settings.use_shared_api:
                        admin_settings.increment_usage()
                    else:
                        # Track on shared provider - ✅ Use cached method for consistency
                        provider_model = AIImageGeneration.get_active_provider(provider_name)
                        if provider_model:
                            provider_model.increment_usage()
                except AdminAISettings.DoesNotExist:
                    # If no personal settings, track on shared provider - ✅ Use cached method
                    provider_model = AIImageGeneration.get_active_provider(provider_name)
                    if provider_model:
                        provider_model.increment_usage()
            else:
                # Track on shared provider - ✅ Use cached method for consistency
                provider_model = AIImageGeneration.get_active_provider(provider_name)
                if provider_model:
                    provider_model.increment_usage()
            
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
        Get list of available content generation providers
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
            
            logger.info(f"[AI Content] Shared active providers: {list(shared_providers)}")
            print(f"[AI Content] Shared active providers: {list(shared_providers)}")
            
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
                
                logger.info(f"[AI Content] Personal active providers for {admin}: {personal_provider_names}")
                print(f"[AI Content] Personal active providers for {admin}: {personal_provider_names}")
                
                # Add personal providers to available list (even if not in shared)
                available_provider_names.update(personal_provider_names)
            
            logger.info(f"[AI Content] Combined available provider names: {available_provider_names}")
            print(f"[AI Content] Combined available provider names: {available_provider_names}")
            
            # Build result list
            result = []
            for provider_name in available_provider_names:
                # Try to get shared provider for ID (if exists)
                shared_provider = next((p for p in shared_providers if p['provider_name'] == provider_name), None)
                
                result.append({
                    'id': shared_provider['id'] if shared_provider else None,  # Use shared provider ID if exists
                    'provider_name': provider_name,
                    'provider_display': cls._get_provider_display(provider_name),
                    'can_generate': True
                })
            
            logger.info(f"[AI Content] Returning {len(result)} providers: {result}")
            print(f"[AI Content] Returning {len(result)} providers: {result}")
            return result
        except Exception as e:
            logger.error(f"[AI Content] Error in get_available_providers: {str(e)}", exc_info=True)
            print(f"[AI Content] Error in get_available_providers: {str(e)}")
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

