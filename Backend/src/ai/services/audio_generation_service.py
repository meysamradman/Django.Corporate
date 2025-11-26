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
from src.media.models.media import AudioMedia
from src.media.services.media_services import MediaAdminService
from src.ai.providers import OpenAIProvider
from src.ai.messages.messages import AI_ERRORS


class AIAudioGenerationService:
    """Service for managing AI audio generation (Text-to-Speech)"""
    
    PROVIDER_CLASSES = {
        'openai': OpenAIProvider,
        # Future: Add other TTS providers here
    }
    
    @classmethod
    def get_provider_instance(cls, provider_name: str, api_key: str, config: Optional[Dict] = None):
        """Create provider instance"""
        provider_class = cls.PROVIDER_CLASSES.get(provider_name)
        if not provider_class:
            raise ValueError(AI_ERRORS["provider_not_supported"].format(provider_name=provider_name))
        return provider_class(api_key, config)
    
    @classmethod
    async def generate_audio_async(
        cls,
        provider_name: str,
        text: str,
        api_key: str,
        config: Optional[Dict] = None,
        **kwargs
    ) -> BytesIO:
        """
        Generate audio asynchronously
        
        Args:
            provider_name: Provider name (openai)
            text: Text to convert to speech
            api_key: Provider API key
            config: Additional settings
            **kwargs: Additional parameters (model, voice, speed, ...)
            
        Returns:
            BytesIO: Generated audio
        """
        provider = cls.get_provider_instance(provider_name, api_key, config)
        
        try:
            audio_bytes = await provider.text_to_speech(text, **kwargs)
            return audio_bytes
        finally:
            await provider.close()
    
    @classmethod
    def generate_audio(
        cls,
        provider_name: str,
        text: str,
        api_key: str,
        config: Optional[Dict] = None,
        **kwargs
    ) -> BytesIO:
        """
        Generate audio (sync wrapper for async)
        """
        try:
            loop = asyncio.get_event_loop()
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
        
        return loop.run_until_complete(
            cls.generate_audio_async(provider_name, text, api_key, config, **kwargs)
        )
    
    @classmethod
    def generate_audio_only(
        cls,
        provider_name: str,
        text: str,
        admin=None,
        **kwargs
    ) -> tuple[BytesIO, dict]:
        """
        Generate audio only without saving to database (for better performance)
        
        Args:
            provider_name: Provider name
            text: Text to convert to speech
            admin: Admin user instance (optional) - if provided, uses personal/shared API based on settings
            **kwargs: Additional parameters (model, voice, speed, ...)
        
        Returns:
            tuple: (audio_bytes, metadata) - Audio and its metadata
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
        
        # ✅ Get TTS defaults from config if available, otherwise use kwargs
        tts_config = config.get('tts', {}) if isinstance(config, dict) else {}
        final_kwargs = {
            'model': kwargs.get('model') or tts_config.get('model', 'tts-1'),
            'voice': kwargs.get('voice') or tts_config.get('voice', 'alloy'),
            'speed': kwargs.get('speed') or tts_config.get('speed', 1.0),
            'response_format': kwargs.get('response_format') or tts_config.get('response_format', 'mp3'),
        }
        
        audio_bytes = cls.generate_audio(
            provider_name=provider_name,
            text=text,
            api_key=api_key,
            config=config,
            **final_kwargs
        )
        
        metadata = {
            'provider_name': provider_name,
            'text': text[:100] + '...' if len(text) > 100 else text,
            'filename': f"ai_generated_{provider_name}_{int(time.time())}.mp3",
        }
        
        return audio_bytes, metadata
    
    @classmethod
    def generate_and_save_to_media(
        cls,
        provider_name: str,
        text: str,
        user_id: Optional[int] = None,
        title: Optional[str] = None,
        save_to_db: bool = True,
        admin=None,
        **kwargs
    ) -> AudioMedia | BytesIO:
        """
        Generate audio and save to Media Library
        
        Args:
            provider_name: Provider name
            text: Text to convert to speech
            user_id: User ID (optional)
            title: Audio title (if not provided, text preview will be used)
            save_to_db: Whether to save to database (default: True)
            admin: Admin user instance (optional) - if provided, uses personal/shared API based on settings
            **kwargs: Additional parameters (model, voice, speed, ...)
            
        Returns:
            AudioMedia: Saved audio
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
        
        # ✅ Get TTS defaults from config if available, otherwise use kwargs
        tts_config = config.get('tts', {}) if isinstance(config, dict) else {}
        final_kwargs = {
            'model': kwargs.get('model') or tts_config.get('model', 'tts-1'),
            'voice': kwargs.get('voice') or tts_config.get('voice', 'alloy'),
            'speed': kwargs.get('speed') or tts_config.get('speed', 1.0),
            'response_format': kwargs.get('response_format') or tts_config.get('response_format', 'mp3'),
        }
        
        audio_bytes = cls.generate_audio(
            provider_name=provider_name,
            text=text,
            api_key=api_key,
            config=config,
            **final_kwargs
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
            return audio_bytes
        
        import time
        filename = f"ai_generated_{provider_name}_{int(time.time())}.mp3"
        
        audio_file = InMemoryUploadedFile(
            file=audio_bytes,
            field_name='file',
            name=filename,
            content_type='audio/mpeg',
            size=len(audio_bytes.getvalue()),
            charset=None
        )
        
        media = MediaAdminService.create_media('audio', {
            'file': audio_file,
            'title': title or text[:100] if len(text) > 100 else text,
        })
        
        # Usage already tracked above
        
        return media

