import asyncio
import time
from typing import Optional, Dict, Any
from io import BytesIO
from django.core.files.base import ContentFile
from django.core.files.uploadedfile import InMemoryUploadedFile
import tempfile
import os

from src.ai.models.image_generation import AIImageGeneration
from src.ai.models.admin_ai_settings import AdminAISettings
from src.media.models.media import ImageMedia
from src.media.services.media_services import MediaAdminService
from src.ai.providers import GeminiProvider, OpenAIProvider, HuggingFaceProvider, OpenRouterProvider
from src.ai.messages.messages import AI_ERRORS


class AIImageGenerationService:
    """Service for managing AI image generation"""
    
    PROVIDER_CLASSES = {
        'gemini': GeminiProvider,
        'openai': OpenAIProvider,
        'huggingface': HuggingFaceProvider,
        'openrouter': OpenRouterProvider,
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
        admin=None,
        **kwargs
    ) -> tuple[BytesIO, dict]:
        """
        Generate image only without saving to database (for better performance)
        
        Args:
            provider_name: Provider name
            prompt: Image description
            admin: Admin user instance (optional) - if provided, uses personal/shared API based on settings
            **kwargs: Additional parameters
        
        Returns:
            tuple: (image_bytes, metadata) - Image and its metadata
        """
        # ✅ Get appropriate API key (personal/shared based on admin settings)
        if admin and hasattr(admin, 'user_type') and admin.user_type == 'admin':
            try:
                api_key = AdminAISettings.get_api_key_for_admin(admin, provider_name)
                # Get config from shared provider (configs are same) - ✅ Use cached method
                provider_config = AIImageGeneration.get_active_provider(provider_name)
                if not provider_config:
                    raise ValueError(AI_ERRORS["provider_not_available"].format(provider_name=provider_name))
                config = provider_config.config or {}
            except AdminAISettings.DoesNotExist:
                # Fallback to shared API - ✅ Use cached method
                provider_config = AIImageGeneration.get_active_provider(provider_name)
                if not provider_config:
                    raise ValueError(AI_ERRORS["provider_not_available"].format(provider_name=provider_name))
                api_key = provider_config.get_api_key()
                config = provider_config.config or {}
        else:
            # Use shared API (default) - ✅ Use Model's cached method for better performance
            provider_config = AIImageGeneration.get_active_provider(provider_name)
            if not provider_config:
                raise ValueError(AI_ERRORS["provider_not_available"].format(provider_name=provider_name))
            
            api_key = provider_config.get_api_key()
            config = provider_config.config or {}
        
        image_bytes = cls.generate_image(
            provider_name=provider_name,
            prompt=prompt,
            api_key=api_key,
            config=config,
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
        admin=None,
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
            admin: Admin user instance (optional) - if provided, uses personal/shared API based on settings
            **kwargs: Additional parameters
            
        Returns:
            ImageMedia: Saved image
        """
        import logging
        logger = logging.getLogger(__name__)
        
        # ✅ Get appropriate API key (personal/shared based on admin settings)
        if admin and hasattr(admin, 'user_type') and admin.user_type == 'admin':
            try:
                api_key = AdminAISettings.get_api_key_for_admin(admin, provider_name)
                # Get config from shared provider (configs are same) - ✅ Use cached method
                provider_config = AIImageGeneration.get_active_provider(provider_name)
                if not provider_config:
                    raise ValueError(AI_ERRORS["provider_not_available"].format(provider_name=provider_name))
                config = provider_config.config or {}
                
                # Check which API is being used
                try:
                    personal_settings = AdminAISettings.objects.get(
                        admin=admin,
                        provider_name=provider_name,
                        is_active=True
                    )
                    if personal_settings.use_shared_api:
                        logger.info(f"🔗 [AI Image Service] ⚡ FINAL DECISION: Using SHARED API (via personal settings - use_shared_api=True)")
                        print(f"🔗 [AI Image Service] ⚡ FINAL DECISION: Using SHARED API (via personal settings - use_shared_api=True)")
                    else:
                        logger.info(f"👤 [AI Image Service] ⚡ FINAL DECISION: Using PERSONAL API (use_shared_api=False)")
                        print(f"👤 [AI Image Service] ⚡ FINAL DECISION: Using PERSONAL API (use_shared_api=False)")
                except AdminAISettings.DoesNotExist:
                    logger.info(f"🔗 [AI Image Service] ⚡ FINAL DECISION: Using SHARED API (no personal settings found)")
                    print(f"🔗 [AI Image Service] ⚡ FINAL DECISION: Using SHARED API (no personal settings found)")
            except AdminAISettings.DoesNotExist:
                # Fallback to shared API - ✅ Use cached method
                logger.info(f"🔗 [AI Image Service] ⚡ FINAL DECISION: Using SHARED API (fallback)")
                print(f"🔗 [AI Image Service] ⚡ FINAL DECISION: Using SHARED API (fallback)")
                provider_config = AIImageGeneration.get_active_provider(provider_name)
                if not provider_config:
                    raise ValueError(AI_ERRORS["provider_not_available"].format(provider_name=provider_name))
                api_key = provider_config.get_api_key()
                config = provider_config.config or {}
        else:
            # Use shared API (default) - ✅ Use Model's cached method for better performance
            logger.info(f"🔗 [AI Image Service] ⚡ FINAL DECISION: Using SHARED API (no admin provided)")
            print(f"🔗 [AI Image Service] ⚡ FINAL DECISION: Using SHARED API (no admin provided)")
            provider_config = AIImageGeneration.get_active_provider(provider_name)
            if not provider_config:
                raise ValueError(AI_ERRORS["provider_not_available"].format(provider_name=provider_name))
            
            api_key = provider_config.get_api_key()
            config = provider_config.config or {}
        
        image_bytes = cls.generate_image(
            provider_name=provider_name,
            prompt=prompt,
            api_key=api_key,
            config=config,
            **kwargs
        )
        
        # ✅ Track usage: if admin uses personal API, track on AdminAISettings; otherwise on shared provider
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
            except AdminAISettings.DoesNotExist:
                # If no personal settings, track on shared provider
                if 'provider_config' in locals() and provider_config:
                    provider_config.increment_usage()
        else:
            # Track on shared provider
            if 'provider_config' in locals() and provider_config:
                provider_config.increment_usage()
        
        if not save_to_db:
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
        
        # Usage already tracked above
        
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
            # Return True on error to prevent blocking (original behavior)
            # Some providers may not support validation or may have network issues
            # Better to allow save and let user test manually
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

