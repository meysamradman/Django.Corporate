import asyncio
import time
from typing import Optional, Dict, Any
from io import BytesIO
from django.core.files.base import ContentFile
from django.core.files.uploadedfile import InMemoryUploadedFile
import tempfile
import os

from src.ai.models import AIProvider, AdminProviderSettings, AICapabilityModel
from src.media.models.media import ImageMedia
from src.media.services.media_services import MediaAdminService
from src.ai.providers.registry import AIProviderRegistry
from src.ai.messages.messages import AI_ERRORS
from src.ai.providers.capabilities import ProviderAvailabilityManager
from src.ai.providers.capabilities import get_default_model

class AIImageGenerationService:
    
    @classmethod
    def get_provider_instance(cls, provider_name: str, api_key: str, config: Optional[Dict] = None):
        provider_class = AIProviderRegistry.get(provider_name)
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
        provider_name: Optional[str],
        prompt: str,
        admin=None,
        model_name: Optional[str] = None,
        **kwargs
    ) -> tuple[BytesIO, dict]:
        capability = 'image'

        if not provider_name or not str(provider_name).strip():
            cm = AICapabilityModel.objects.get_active(capability)
            if not cm:
                raise ValueError(
                    AI_ERRORS.get('no_active_model_any_provider').format(capability=capability)
                )
            provider_name = cm.provider.slug
            model_name = cm.model_id
        elif not model_name:
            cm = (
                AICapabilityModel.objects.filter(
                    capability=capability,
                    provider__slug=provider_name,
                    provider__is_active=True,
                )
                .select_related('provider')
                .order_by('sort_order', 'id')
                .first()
            )
            if cm:
                model_name = cm.model_id
            else:
                default_model_id = get_default_model(provider_name, capability)
                if default_model_id:
                    model_name = default_model_id
                else:
                    provider = AIProvider.get_provider_by_slug(provider_name)
                    static_models = provider.get_static_models(capability) if provider else []
                    if static_models:
                        model_name = static_models[0]
        
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
                    api_key = settings.get_personal_api_key()
                    if not api_key or not api_key.strip():
                        api_key = provider.get_shared_api_key()
                        if not api_key or not api_key.strip():
                            raise ValueError(AI_ERRORS["api_key_not_set"].format(provider_name=provider_name))
                    api_type = 'PERSONAL' if (settings.get_personal_api_key() and settings.get_personal_api_key().strip()) else 'SHARED'
                else:
                    api_key = provider.get_shared_api_key()
                
                config = provider.config or {}
                if model_name:
                    config['model'] = model_name
            except AIProvider.DoesNotExist:
                raise ValueError(AI_ERRORS["provider_not_found_or_inactive"].format(provider_name=provider_name))
        else:
            try:
                provider = AIProvider.objects.get(slug=provider_name, is_active=True)
                api_key = provider.get_shared_api_key()
                config = provider.config or {}
                if model_name:
                    config['model'] = model_name
            except AIProvider.DoesNotExist:
                raise ValueError(AI_ERRORS["provider_not_found_or_inactive"].format(provider_name=provider_name))
        
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
            'model': model_name,
        }
        
        return image_bytes, metadata
    
    @classmethod
    def generate_and_save_to_media(
        cls,
        provider_name: Optional[str],
        prompt: str,
        user_id: Optional[int] = None,
        title: Optional[str] = None,
        alt_text: Optional[str] = None,
        save_to_db: bool = True,
        admin=None,
        model_name: Optional[str] = None,
        **kwargs
    ) -> ImageMedia:
        capability = 'image'
        if not provider_name or not str(provider_name).strip():
            cm = AICapabilityModel.objects.get_active(capability)
            if not cm:
                raise ValueError(
                    AI_ERRORS.get('no_active_model_any_provider').format(capability=capability)
                )
            provider_name = cm.provider.slug
            model_name = cm.model_id

        try:
            provider = AIProvider.objects.get(slug=provider_name, is_active=True)
        except AIProvider.DoesNotExist:
            raise ValueError(AI_ERRORS["provider_not_found_or_inactive"].format(provider_name=provider_name))
        
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

        if not model_name:
            cm = (
                AICapabilityModel.objects.filter(
                    capability=capability,
                    provider__slug=provider_name,
                    provider__is_active=True,
                )
                .select_related('provider')
                .order_by('sort_order', 'id')
                .first()
            )
            if cm:
                model_name = cm.model_id
            else:
                default_model_id = get_default_model(provider_name, capability)
                if default_model_id:
                    model_name = default_model_id
                else:
                    provider = AIProvider.get_provider_by_slug(provider_name)
                    static_models = provider.get_static_models(capability) if provider else []
                    if static_models:
                        model_name = static_models[0]

        if model_name:
            config['model'] = model_name
        
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
    def validate_and_update_provider(cls, provider_instance, api_key: str, slug: str) -> bool:
        if api_key and api_key != '***' and api_key.strip():
            if provider_instance and provider_instance.shared_api_key and api_key == '***':
                return True
            
            try:
                is_valid = cls.validate_provider_api_key(slug, api_key.strip())
                if not is_valid:
                    return False
            except Exception:
                return False
        return True
    
    @classmethod
    def get_available_providers(cls) -> list:
        all_providers = ProviderAvailabilityManager.get_available_providers('image')
        registered_providers = AIProviderRegistry.get_registered_names()
        return [p for p in all_providers if p['provider_name'] in registered_providers]

