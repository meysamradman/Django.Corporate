import asyncio
import time
from typing import Dict, Any, Optional
from django.utils.text import slugify
from src.ai.models.image_generation import AIImageGeneration
from src.ai.providers import GeminiProvider, OpenAIProvider, HuggingFaceProvider, DeepSeekProvider


class AIContentGenerationService:
    """Service for AI content generation - generates content without caching"""
    
    PROVIDER_MAP = {
        'gemini': GeminiProvider,
        'openai': OpenAIProvider,
        'deepseek': DeepSeekProvider,
        # Note: Hugging Face Inference API has limitations for text generation (404 errors)
        # 'huggingface': HuggingFaceProvider,  # Disabled due to API limitations
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
    def generate_content(cls, topic: str, provider_name: str = 'gemini', **kwargs) -> Dict[str, Any]:
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
            provider = cls.get_provider(provider_name)
            
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
            
            # Increment provider usage
            provider_model = AIImageGeneration.objects.get(provider_name=provider_name)
            provider_model.increment_usage()
            
            # Close provider connection
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                loop.run_until_complete(provider.close())
            finally:
                loop.close()
            
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
    def get_available_providers(cls) -> list:
        """Get list of available content generation providers"""
        # Filter active providers that support content generation
        # Note: Hugging Face Inference API has limitations for text generation, so we exclude it
        providers = AIImageGeneration.objects.filter(
            provider_name__in=['gemini', 'openai', 'deepseek'],  # Added deepseek, removed huggingface due to API limitations
            is_active=True
        ).values('id', 'provider_name')
        
        result = []
        for provider in providers:
            result.append({
                'id': provider['id'],
                'provider_name': provider['provider_name'],
                'provider_display': cls._get_provider_display(provider['provider_name']),
                'can_generate': True
            })
        
        return result
    
    @classmethod
    def _get_provider_display(cls, provider_name: str) -> str:
        """Get display name for provider"""
        display_names = {
            'gemini': 'Google Gemini',
            'openai': 'OpenAI GPT',
            'deepseek': 'DeepSeek AI',
            'huggingface': 'Hugging Face',
        }
        return display_names.get(provider_name, provider_name)

