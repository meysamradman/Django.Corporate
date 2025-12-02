import asyncio
import time
import asyncio
from typing import Optional, Dict, Any
from io import BytesIO
from django.core.files.base import ContentFile
from django.core.files.uploadedfile import InMemoryUploadedFile
import tempfile
import os

from src.ai.models import AIProvider, AdminProviderSettings
from src.media.models.media import ImageMedia
from src.media.services.media_services import MediaAdminService
from src.ai.providers import GeminiProvider, OpenAIProvider, HuggingFaceProvider, OpenRouterProvider
from src.ai.messages.messages import AI_ERRORS


class AIImageGenerationService:
    
    PROVIDER_CLASSES = {
        'gemini': GeminiProvider,
        'openai': OpenAIProvider,
        'huggingface': HuggingFaceProvider,
        'openrouter': OpenRouterProvider,
    }
    
    @classmethod
    def get_provider_instance(cls, provider_name: str, api_key: str, config: Optional[Dict] = None):
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
        if admin and hasattr(admin, 'user_type') and admin.user_type == 'admin':

            try:
                provider = AIProvider.objects.get(slug=provider_name, is_active=True)
                settings = AdminProviderSettings.objects.filter(
                    admin=admin,
                    provider=provider,
                    is_active=True
                ).first()
                
                admin_id = getattr(admin, 'id', 'unknown')
                if settings:
                    api_key = settings.get_api_key()
                    api_type = 'SHARED' if settings.use_shared_api else 'PERSONAL'
                else:
                    api_key = provider.get_shared_api_key()
                
                config = provider.config or {}
            except AIProvider.DoesNotExist:
                raise ValueError(f"Provider '{provider_name}' not found or inactive")
        else:

            try:
                provider = AIProvider.objects.get(slug=provider_name, is_active=True)
                api_key = provider.get_shared_api_key()
                config = provider.config or {}
            except AIProvider.DoesNotExist:
                raise ValueError(f"Provider '{provider_name}' not found or inactive")
        
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

        try:
            provider = AIProvider.objects.get(slug=provider_name, is_active=True)
        except AIProvider.DoesNotExist:
            raise ValueError(f"Provider '{provider_name}' not found or inactive")
        
        # ✅ Get appropriate API key
        if admin and hasattr(admin, 'user_type') and admin.user_type == 'admin':
            settings = AdminProviderSettings.objects.filter(
                admin=admin,
                provider=provider,
                is_active=True
            ).first()
            
            if settings:
                api_key = settings.get_api_key()
            else:
                api_key = provider.get_shared_api_key()
        else:
            api_key = provider.get_shared_api_key()
        
        config = provider.config or {}
        
        image_bytes = cls.generate_image(
            provider_name=provider_name,
            prompt=prompt,
            api_key=api_key,
            config=config,
            **kwargs
        )
        
        provider.increment_usage()
        if admin and hasattr(admin, 'user_type') and admin.user_type == 'admin':
            settings = AdminProviderSettings.objects.filter(
                admin=admin,
                provider=provider,
                is_active=True
            ).first()
            if settings:
                settings.increment_usage()
        
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
        
        return media
    
    @classmethod
    def validate_provider_api_key(cls, provider_name: str, api_key: str) -> bool:

        try:
            provider = cls.get_provider_instance(provider_name, api_key)
            is_valid = provider.validate_api_key()
            return is_valid
        except Exception as e:

            return True
    
    @classmethod
    def get_available_providers(cls) -> list:
        from src.ai.providers.capabilities import ProviderAvailabilityManager
        all_providers = ProviderAvailabilityManager.get_available_providers('image')
        return [p for p in all_providers if p['provider_name'] in cls.PROVIDER_CLASSES]

