from django.db import models
from src.core.models.base import BaseModel
import hashlib


class AIContentGeneration(BaseModel):
    """
    Model for caching AI-generated content for performance optimization
    """
    
    # Cache key based on prompt and settings
    cache_key = models.CharField(
        max_length=255,
        unique=True,
        db_index=True,
        verbose_name="Cache Key",
        help_text="Hash of prompt + provider + settings for fast lookup"
    )
    
    # Original input
    prompt = models.TextField(
        verbose_name="Prompt",
        help_text="Original user prompt/topic"
    )
    
    provider_name = models.CharField(
        max_length=50,
        verbose_name="Provider",
        help_text="AI provider used (gemini, openai)"
    )
    
    # Generated content (SEO optimized)
    title = models.CharField(
        max_length=200,
        verbose_name="Title",
        help_text="Main title (H1)"
    )
    
    meta_title = models.CharField(
        max_length=60,
        verbose_name="Meta Title",
        help_text="SEO meta title (50-60 characters)"
    )
    
    meta_description = models.TextField(
        max_length=160,
        verbose_name="Meta Description",
        help_text="SEO meta description (150-160 characters)"
    )
    
    slug = models.SlugField(
        max_length=200,
        db_index=True,
        verbose_name="Slug",
        help_text="URL-friendly slug"
    )
    
    # Content structure
    content = models.TextField(
        verbose_name="Content",
        help_text="Main content body (~500 words, SEO optimized)"
    )
    
    h1 = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        verbose_name="H1",
        help_text="Main heading (if different from title)"
    )
    
    h2_list = models.JSONField(
        default=list,
        blank=True,
        verbose_name="H2 Headings",
        help_text="List of H2 headings"
    )
    
    h3_list = models.JSONField(
        default=list,
        blank=True,
        verbose_name="H3 Headings",
        help_text="List of H3 headings"
    )
    
    keywords = models.JSONField(
        default=list,
        blank=True,
        verbose_name="Keywords",
        help_text="SEO keywords extracted from content"
    )
    
    word_count = models.IntegerField(
        default=0,
        verbose_name="Word Count",
        help_text="Approximate word count"
    )
    
    # Settings used for generation
    settings = models.JSONField(
        default=dict,
        blank=True,
        verbose_name="Generation Settings",
        help_text="Settings used (word_count, tone, language, etc.)"
    )
    
    # Performance tracking
    generation_time_ms = models.IntegerField(
        default=0,
        verbose_name="Generation Time (ms)",
        help_text="Time taken to generate content in milliseconds"
    )
    
    usage_count = models.IntegerField(
        default=0,
        verbose_name="Usage Count",
        help_text="Number of times this cached content was used"
    )
    
    class Meta:
        verbose_name = "AI Generated Content"
        verbose_name_plural = "AI Generated Contents"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['cache_key']),
            models.Index(fields=['provider_name', '-created_at']),
            models.Index(fields=['slug']),
        ]
    
    def __str__(self):
        return f"{self.title} ({self.provider_name})"
    
    @staticmethod
    def generate_cache_key(prompt: str, provider_name: str, settings: dict) -> str:
        """Generate cache key from prompt and settings"""
        # Normalize inputs
        normalized_prompt = prompt.strip().lower()
        settings_str = str(sorted(settings.items()))
        combined = f"{normalized_prompt}::{provider_name}::{settings_str}"
        return hashlib.md5(combined.encode()).hexdigest()
    
    @classmethod
    def get_cached_content(cls, prompt: str, provider_name: str, settings: dict):
        """Get cached content if exists"""
        cache_key = cls.generate_cache_key(prompt, provider_name, settings)
        try:
            cached = cls.objects.get(cache_key=cache_key)
            cached.usage_count += 1
            cached.save(update_fields=['usage_count'])
            return cached
        except cls.DoesNotExist:
            return None
    
    @classmethod
    def cache_content(cls, prompt: str, provider_name: str, **kwargs):
        """Cache generated content"""
        settings = kwargs.pop('settings', {})
        cache_key = cls.generate_cache_key(prompt, provider_name, settings)
        
        # Create or update
        content_obj, created = cls.objects.update_or_create(
            cache_key=cache_key,
            defaults={
                'prompt': prompt,
                'provider_name': provider_name,
                'settings': settings,
                **kwargs
            }
        )
        return content_obj

