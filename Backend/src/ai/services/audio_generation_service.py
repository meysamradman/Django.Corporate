import asyncio
import time
from typing import Optional, Dict, Any
from io import BytesIO
from django.core.files.base import ContentFile
from django.core.files.uploadedfile import InMemoryUploadedFile
import tempfile
import os

from src.ai.models import AIProvider, AdminProviderSettings
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
    def _get_api_key_and_config(cls, provider_name: str, admin=None) -> tuple[str, dict]:
        """
        Get API key and config based on new dynamic system
        
        Args:
            provider_name: Provider slug (openai, gemini, etc)
            admin: Admin user instance
        
        Returns:
            tuple: (api_key, config)
        """
        # Get provider
        try:
            provider = AIProvider.objects.get(slug=provider_name, is_active=True)
        except AIProvider.DoesNotExist:
            raise ValueError(AI_ERRORS["provider_not_available"].format(provider_name=provider_name))
        
        # Check admin settings first (personal API)
        if admin:
            try:
                settings = AdminProviderSettings.objects.get(
                    admin=admin,
                    provider=provider,
                    is_active=True
                )
                
                # If has personal API key and not using shared
                if not settings.use_shared_api and settings.personal_api_key:
                    return settings.get_personal_api_key(), provider.config or {}
            except AdminProviderSettings.DoesNotExist:
                pass
        
        # Use shared API
        if not provider.shared_api_key:
            raise ValueError(AI_ERRORS["api_key_required"])
        
        return provider.get_shared_api_key(), provider.config or {}
    
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
        # ✅ Get API key using new dynamic system
        api_key, config = cls._get_api_key_and_config(provider_name, admin)
        
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
        
        # ✅ Get API key using new dynamic system
        api_key, config = cls._get_api_key_and_config(provider_name, admin)
        
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
        
        # ✅ Track usage on provider
        try:
            provider = AIProvider.objects.get(slug=provider_name, is_active=True)
            provider.increment_usage()
        except AIProvider.DoesNotExist:
            pass
        
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
        
        return media
