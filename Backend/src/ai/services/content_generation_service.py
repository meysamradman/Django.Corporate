import asyncio
import time
from typing import Dict, Any, Optional
from django.core.cache import cache
from django.utils.text import slugify
from src.ai.models.image_generation import AIImageGeneration
from src.ai.models.content_generation import AIContentGeneration
from src.ai.providers import GeminiProvider, OpenAIProvider, HuggingFaceProvider, DeepSeekProvider


class AIContentGenerationService:
    """Service for AI content generation with caching and optimization"""
    
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
        Generate SEO-optimized content
        
        Args:
            topic: Content topic/subject
            provider_name: AI provider ('gemini' or 'openai')
            **kwargs: Additional settings:
                - word_count: Target word count (default: 500)
                - tone: Content tone (default: 'professional')
                - keywords: List of keywords (optional)
                - use_cache: Use cached content if available (default: True)
                - save_to_cache: Save generated content to cache (default: False - for performance, but user can choose)
        
        Returns:
            Dict with SEO-optimized content structure
        """
        word_count = kwargs.get('word_count', 500)
        tone = kwargs.get('tone', 'professional')
        keywords = kwargs.get('keywords', [])
        use_cache = kwargs.get('use_cache', True)
        save_to_cache = kwargs.get('save_to_cache', False)  # Default: don't cache (user can choose to save later)
        
        # Check cache first
        settings = {
            'word_count': word_count,
            'tone': tone,
            'keywords': sorted(keywords) if keywords else []
        }
        
        if use_cache:
            cached = AIContentGeneration.get_cached_content(topic, provider_name, settings)
            if cached:
                return cls._format_response(cached)
        
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
            if 'h2_list' not in seo_data:
                seo_data['h2_list'] = []
            if 'h3_list' not in seo_data:
                seo_data['h3_list'] = []
            if 'keywords' not in seo_data:
                seo_data['keywords'] = keywords if keywords else []
            if 'word_count' not in seo_data:
                # Approximate word count
                content_text = seo_data.get('content', '')
                seo_data['word_count'] = len(content_text.split())
            
            # Only cache if user wants to save
            cached_obj = None
            if save_to_cache:
                cached_obj = AIContentGeneration.cache_content(
                    prompt=topic,
                    provider_name=provider_name,
                    title=seo_data['title'],
                    meta_title=seo_data['meta_title'],
                    meta_description=seo_data['meta_description'],
                    slug=seo_data['slug'],
                    h1=seo_data.get('h1'),
                    h2_list=seo_data.get('h2_list', []),
                    h3_list=seo_data.get('h3_list', []),
                    content=seo_data['content'],
                    keywords=seo_data.get('keywords', []),
                    word_count=seo_data.get('word_count', 0),
                    settings=settings,
                    generation_time_ms=generation_time_ms
                )
            else:
                # Create temporary object for response formatting (not saved to DB)
                from src.ai.models.content_generation import AIContentGeneration
                cached_obj = AIContentGeneration(
                    title=seo_data['title'],
                    meta_title=seo_data['meta_title'],
                    meta_description=seo_data['meta_description'],
                    slug=seo_data['slug'],
                    h1=seo_data.get('h1'),
                    h2_list=seo_data.get('h2_list', []),
                    h3_list=seo_data.get('h3_list', []),
                    content=seo_data['content'],
                    keywords=seo_data.get('keywords', []),
                    word_count=seo_data.get('word_count', 0),
                    provider_name=provider_name,
                    generation_time_ms=generation_time_ms,
                    cache_key='',  # Not saved, so no cache key needed
                    prompt=topic,
                    settings=settings,
                )
            
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
            
            return cls._format_response(cached_obj, generation_time_ms)
            
        except ValueError as e:
            raise e
        except Exception as e:
            raise Exception(f"خطا در تولید محتوا: {str(e)}")
    
    @classmethod
    def _format_response(cls, content_obj: AIContentGeneration, generation_time_ms: Optional[int] = None) -> Dict[str, Any]:
        """Format response from content object"""
        return {
            'id': content_obj.id if content_obj.pk else None,  # None if not saved to DB
            'title': content_obj.title,
            'meta_title': content_obj.meta_title,
            'meta_description': content_obj.meta_description,
            'slug': content_obj.slug,
            'h1': content_obj.h1 or content_obj.title,
            'h2_list': content_obj.h2_list or [],
            'h3_list': content_obj.h3_list or [],
            'content': content_obj.content,
            'keywords': content_obj.keywords or [],
            'word_count': content_obj.word_count,
            'provider_name': content_obj.provider_name,
            'generation_time_ms': generation_time_ms or content_obj.generation_time_ms,
            'cached': content_obj.usage_count > 0 if hasattr(content_obj, 'usage_count') else False,
            'saved': content_obj.pk is not None,  # Whether it's saved to database
            'created_at': content_obj.created_at.isoformat() if hasattr(content_obj, 'created_at') and content_obj.created_at else None,
        }
    
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

