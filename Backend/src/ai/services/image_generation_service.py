import asyncio
import time
from typing import Optional, Dict, Any
from io import BytesIO
from django.core.files.base import ContentFile
from django.core.files.uploadedfile import InMemoryUploadedFile
from django.core.cache import cache
import tempfile
import os

from src.ai.models.image_generation import AIImageGeneration
from src.media.models.media import ImageMedia
from src.media.services.media_services import MediaAdminService
from src.ai.providers import GeminiProvider, OpenAIProvider, HuggingFaceProvider
from src.ai.messages.messages import AI_ERRORS


class AIImageGenerationService:
    """Service for managing AI image generation"""
    
    PROVIDER_CLASSES = {
        'gemini': GeminiProvider,
        'openai': OpenAIProvider,
        'huggingface': HuggingFaceProvider,
    }
    
    @classmethod
    def get_provider_instance(cls, provider_name: str, api_key: str, config: Optional[Dict] = None):
        """Create provider instance"""
        provider_class = cls.PROVIDER_CLASSES.get(provider_name)
        if not provider_class:
            raise ValueError(AI_ERRORS["provider_not_supported"].format(provider_name=provider_name))
        return provider_class(api_key, config)
    
    @classmethod
    async def generate_image_async(
        cls,
        provider_name: str,
        prompt: str,
        api_key: str,
        config: Optional[Dict] = None,
        **kwargs
    ) -> BytesIO:
        """
        Generate image asynchronously
        
        Args:
            provider_name: Provider name (gemini, openai, ...)
            prompt: Image description
            api_key: Model API key
            config: Additional settings
            **kwargs: Additional parameters (size, quality, ...)
            
        Returns:
            BytesIO: Generated image
        """
        provider = cls.get_provider_instance(provider_name, api_key, config)
        
        try:
            image_bytes = await provider.generate_image(prompt, **kwargs)
            return image_bytes
        finally:
            await provider.close()
    
    @classmethod
    def generate_image(
        cls,
        provider_name: str,
        prompt: str,
        api_key: str,
        config: Optional[Dict] = None,
        **kwargs
    ) -> BytesIO:
        """
        Generate image (sync wrapper for async)
        """
        try:
            loop = asyncio.get_event_loop()
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
        
        return loop.run_until_complete(
            cls.generate_image_async(provider_name, prompt, api_key, config, **kwargs)
        )
    
    @classmethod
    def generate_image_only(
        cls,
        provider_name: str,
        prompt: str,
        **kwargs
    ) -> tuple[BytesIO, dict]:
        """
        Generate image only without saving to database (for better performance)
        
        Returns:
            tuple: (image_bytes, metadata) - Image and its metadata
        """
        cache_key = f'ai_provider_{provider_name}'
        provider_config = cache.get(cache_key)
        
        if not provider_config:
            try:
                provider_config = AIImageGeneration.objects.get(
                    provider_name=provider_name,
                    is_active=True
                )
                cache.set(cache_key, provider_config, 300)
            except AIImageGeneration.DoesNotExist:
                raise ValueError(AI_ERRORS["provider_not_available"].format(provider_name=provider_name))
        
        image_bytes = cls.generate_image(
            provider_name=provider_name,
            prompt=prompt,
            api_key=provider_config.get_api_key(),
            config=provider_config.config,
            **kwargs
        )
        
        metadata = {
            'provider_name': provider_name,
            'prompt': prompt,
            'filename': f"ai_generated_{provider_name}_{int(time.time())}.png",
        }
        
        return image_bytes, metadata
    
    @classmethod
    def generate_and_save_to_media(
        cls,
        provider_name: str,
        prompt: str,
        user_id: Optional[int] = None,
        title: Optional[str] = None,
        alt_text: Optional[str] = None,
        save_to_db: bool = True,
        **kwargs
    ) -> ImageMedia:
        """
        Generate image and save to Media Library
        
        Args:
            provider_name: Provider name
            prompt: Image description
            user_id: User ID (optional)
            title: Image title (if not provided, prompt will be used)
            alt_text: Image alt text
            save_to_db: Whether to save to database (default: True)
            **kwargs: Additional parameters
            
        Returns:
            ImageMedia: Saved image
        """
        cache_key = f'ai_provider_{provider_name}'
        provider_config = cache.get(cache_key)
        
        if not provider_config:
            try:
                provider_config = AIImageGeneration.objects.get(
                    provider_name=provider_name,
                    is_active=True
                )
                cache.set(cache_key, provider_config, 300)
            except AIImageGeneration.DoesNotExist:
                raise ValueError(AI_ERRORS["provider_not_available"].format(provider_name=provider_name))
        
        image_bytes = cls.generate_image(
            provider_name=provider_name,
            prompt=prompt,
            api_key=provider_config.get_api_key(),
            config=provider_config.config,
            **kwargs
        )
        
        if not save_to_db:
            provider_config.increment_usage()
            return image_bytes
        
        import time
        filename = f"ai_generated_{provider_name}_{int(time.time())}.png"
        
        image_file = InMemoryUploadedFile(
            file=image_bytes,
            field_name='file',
            name=filename,
            content_type='image/png',
            size=len(image_bytes.getvalue()),
            charset=None
        )
        
        media = MediaAdminService.create_media('image', {
            'file': image_file,
            'title': title or prompt[:100],
            'alt_text': alt_text or prompt[:200],
        })
        
        provider_config.increment_usage()
        
        return media
    
    @classmethod
    def validate_provider_api_key(cls, provider_name: str, api_key: str) -> bool:
        """
        Validate API key
        
        Args:
            provider_name: Provider name
            api_key: API key to validate
            
        Returns:
            bool: Is API key valid?
        """
        try:
            provider = cls.get_provider_instance(provider_name, api_key)
            is_valid = provider.validate_api_key()
            return is_valid
        except Exception as e:
            return True
    
    @classmethod
    def get_available_providers(cls) -> list:
        """
        Get list of active providers that can generate images
        """
        providers = AIImageGeneration.get_active_providers().exclude(provider_name='gemini')
        return list(providers.values(
            'id',
            'provider_name',
            'is_active',
            'usage_count',
            'last_used_at'
        ))

