import asyncio
import time
from typing import Optional, Dict, Any
from io import BytesIO
from django.core.exceptions import ValidationError
from django.core.files.base import ContentFile
from django.core.files.uploadedfile import InMemoryUploadedFile
import tempfile
import os

from src.ai.models import AIProvider, AdminProviderSettings
from src.media.models.media import AudioMedia
from src.media.services.media_services import MediaAdminService
from src.ai.providers.registry import AIProviderRegistry
from src.ai.messages.messages import AI_ERRORS
from src.ai.providers.capabilities import ProviderAvailabilityManager

class AIAudioGenerationService:
    
    @classmethod
    def get_available_providers(cls) -> list:
        all_providers = ProviderAvailabilityManager.get_available_providers('audio')
        registered_providers = AIProviderRegistry.get_registered_names()
        return [p for p in all_providers if p['provider_name'] in registered_providers]
    
    @classmethod
    def validate_provider_for_audio(cls, provider_name: str) -> bool:
        if provider_name != 'openai':
            return False
        
        try:
            provider = AIProvider.objects.get(slug=provider_name, is_active=True)
            if not provider.shared_api_key:
                return False
            return True
        except AIProvider.DoesNotExist:
            return False
    
    @classmethod
    def _get_api_key_and_config(cls, provider_name: str, admin=None) -> tuple[str, dict]:
        try:
            provider = AIProvider.objects.get(slug=provider_name, is_active=True)
        except AIProvider.DoesNotExist:
            raise ValueError(AI_ERRORS["provider_not_available"].format(provider_name=provider_name))

        if admin:
            try:
                settings = AdminProviderSettings.objects.get(
                    admin=admin,
                    provider=provider,
                    is_active=True
                )
                return settings.get_api_key(), provider.config or {}
            except AdminProviderSettings.DoesNotExist:
                is_super = getattr(admin, 'is_superuser', False) or getattr(admin, 'is_admin_full', False)
                if not is_super and not provider.allow_shared_for_normal_admins:
                    raise ValueError(AI_ERRORS["api_key_required"])
            except ValidationError as exc:
                raise ValueError(str(exc))

        if not provider.shared_api_key:
            raise ValueError(AI_ERRORS["api_key_required"])
        
        return provider.get_shared_api_key(), provider.config or {}
    
    @classmethod
    def get_provider_instance(cls, provider_name: str, api_key: str, config: Optional[Dict] = None):
        
        provider_class = AIProviderRegistry.get(provider_name)
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
        api_key, config = cls._get_api_key_and_config(provider_name, admin)

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
        api_key, config = cls._get_api_key_and_config(provider_name, admin)

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

        try:
            provider = AIProvider.objects.get(slug=provider_name, is_active=True)
            provider.increment_usage()
        except AIProvider.DoesNotExist:
            pass
        
        if not save_to_db:
            return audio_bytes
        
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
