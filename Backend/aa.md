from rest_framework import viewsets, status
from rest_framework import viewsets, status
from rest_framework.decorators import action
from django.db import transaction

from src.ai.models.image_generation import AIImageGeneration
from src.ai.serializers.image_generation_serializer import (
    AIImageGenerationSerializer,
    AIImageGenerationListSerializer,
    AIImageGenerationRequestSerializer
)
from src.ai.services.image_generation_service import AIImageGenerationService
from src.media.serializers.media_serializer import MediaAdminSerializer
from src.ai.messages.messages import AI_SUCCESS, AI_ERRORS
from src.user.auth.admin_session_auth import CSRFExemptSessionAuthentication
from src.core.responses import APIResponse
from src.user.authorization import AiManagerAccess, SuperAdminOnly  # Auto-generated from factory
from src.user.permissions import PermissionValidator
from src.ai.providers.capabilities import get_provider_capabilities, supports_feature  # ✅ اضافه شد


class AIImageGenerationProviderViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing API keys and AI model settings
    ⚠️ فقط سوپر ادمین - مدیریت API Keys
    """
    authentication_classes = [CSRFExemptSessionAuthentication]
    permission_classes = [SuperAdminOnly]  # ✅ فقط سوپر ادمین
    queryset = AIImageGeneration.objects.all()
    serializer_class = AIImageGenerationSerializer
    lookup_field = 'id'
    
    def get_queryset(self):
        """Filter queryset"""
        return AIImageGeneration.objects.all().order_by('-created_at')
    
    def list(self, request, *args, **kwargs):
        """
        List all providers from PROVIDER_CHOICES, including ones that don't exist in DB yet.
        This ensures all providers are shown in the settings page, even if no API key has been set.
        """
        import logging
        logger = logging.getLogger(__name__)
        
        logger.info(f"[AI Image View] list() called by user: {request.user}")
        print(f"[AI Image View] list() called by user: {request.user}")
        
        try:
            # Get all providers from DB
            db_providers = AIImageGeneration.objects.all()
            db_provider_dict = {p.provider_name: p for p in db_providers}
            
            logger.info(f"[AI Image View] Found {len(db_providers)} providers in DB: {[p.provider_name for p in db_providers]}")
            print(f"[AI Image View] Found {len(db_providers)} providers in DB: {[p.provider_name for p in db_providers]}")
            logger.info(f"[AI Image View] Provider states: {[(p.provider_name, p.is_active, bool(p.api_key)) for p in db_providers]}")
            print(f"[AI Image View] Provider states: {[(p.provider_name, p.is_active, bool(p.api_key)) for p in db_providers]}")
            
            # Build list of all providers from PROVIDER_CHOICES
            all_providers_data = []
            for provider_value, provider_display in AIImageGeneration.PROVIDER_CHOICES:
                try:
                    if provider_value in db_provider_dict:
                        # Provider exists in DB - serialize DB instance
                        provider = db_provider_dict[provider_value]
                        serializer = self.get_serializer(provider)
                        provider_data = serializer.data
                        # ✅ Ensure config is always a dict
                        if 'config' not in provider_data or provider_data['config'] is None:
                            provider_data['config'] = {}
                        logger.info(f"[AI Image View] Provider {provider_value} from DB: is_active={provider.is_active}, has_api_key={bool(provider.api_key)}")
                    else:
                        # Provider doesn't exist in DB - create data manually
                        provider_data = {
                            'id': None,
                            'provider_name': provider_value,
                            'provider_display': provider_display,
                            'has_api_key': False,
                            'is_active': False,
                            'can_generate': False,
                            'usage_count': 0,
                            'last_used_at': None,
                            'config': {},  # Empty config for new providers
                        }
                        logger.info(f"[AI Image View] Provider {provider_value} not in DB, created manually")
                    
                    all_providers_data.append(provider_data)
                except Exception as e:
                    logger.error(f"[AI Image View] Error serializing provider {provider_value}: {str(e)}", exc_info=True)
                    print(f"[AI Image View] Error serializing provider {provider_value}: {str(e)}")
                    # Add fallback data
                    all_providers_data.append({
                        'id': None,
                        'provider_name': provider_value,
                        'provider_display': provider_display,
                        'has_api_key': False,
                        'is_active': False,
                        'can_generate': False,
                        'usage_count': 0,
                        'last_used_at': None,
                        'config': {},
                    })
            
            logger.info(f"[AI Image View] Returning {len(all_providers_data)} providers")
            print(f"[AI Image View] Returning {len(all_providers_data)} providers")
            logger.info(f"[AI Image View] Provider data: {all_providers_data}")
            print(f"[AI Image View] Provider data: {all_providers_data}")
            return APIResponse.success(
                message=AI_SUCCESS.get("providers_list_retrieved", "لیست Provider ها دریافت شد."),
                data=all_providers_data
            )
        except Exception as e:
            logger.error(f"[AI Image View] Error in list(): {str(e)}", exc_info=True)
            raise
    
    def update(self, request, *args, **kwargs):
        """Update method override - فقط سوپر ادمین"""
        # SuperAdminOnly permission class already handles this
        # No need for additional permission check
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        if getattr(instance, '_prefetched_objects_cache', None):
            instance._prefetched_objects_cache = {}
        return APIResponse.success(
            message=AI_SUCCESS["provider_updated"],
            data=serializer.data
        )
    
    def create(self, request, *args, **kwargs):
        """Create or update Provider - فقط سوپر ادمین"""
        # SuperAdminOnly permission class already handles this
        # No need for additional permission check
        provider_name = request.data.get('provider_name')
        if not provider_name:
            return APIResponse.error(
                message=AI_ERRORS["provider_name_required"],
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            provider = AIImageGeneration.objects.get(provider_name=provider_name)
            serializer = self.get_serializer(provider, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            self.perform_update(serializer)
            return APIResponse.success(
                message=AI_SUCCESS["provider_updated"],
                data=serializer.data,
                status_code=status.HTTP_200_OK
            )
        except AIImageGeneration.DoesNotExist:
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)
            return APIResponse.success(
                message=AI_SUCCESS["provider_created"],
                data=serializer.data,
                status_code=status.HTTP_201_CREATED
            )
    
    def get_serializer_class(self):
        """Use appropriate serializer for different actions"""
        if self.action == 'list':
            return AIImageGenerationListSerializer
        return AIImageGenerationSerializer
    
    @action(detail=False, methods=['get'], url_path='capabilities')
    def get_capabilities(self, request):
        """
        Get capabilities for all providers or a specific provider
        
        Query params:
            - provider_name: Optional - specific provider to check
        
        Returns:
            - All capabilities if no provider specified
            - Specific provider capabilities if provider_name is provided
        """
        import logging
        logger = logging.getLogger(__name__)
        
        provider_name = request.query_params.get('provider_name')
        
        if provider_name:
            # Get capabilities for specific provider
            caps = get_provider_capabilities(provider_name)
            return APIResponse.success(
                message=f"قابلیت‌های {provider_name} دریافت شد",
                data=caps,
                status_code=status.HTTP_200_OK
            )
        else:
            # Get all capabilities
            from src.ai.providers.capabilities import PROVIDER_CAPABILITIES
            return APIResponse.success(
                message="قابلیت‌های تمام Provider ها دریافت شد",
                data=PROVIDER_CAPABILITIES,
                status_code=status.HTTP_200_OK
            )
    
    @action(detail=False, methods=['get'], url_path='available')
    def available_providers(self, request):
        """
        Get list of active providers (that have API key and are active)
        """
        import logging
        logger = logging.getLogger(__name__)
        
        logger.info(f"[AI Image View] available_providers() called by user: {request.user}")
        print(f"[AI Image View] available_providers() called by user: {request.user}")
        
        if not PermissionValidator.has_permission(request.user, 'ai.manage'):
            logger.warning(f"[AI Image View] Permission denied for user: {request.user}")
            print(f"[AI Image View] Permission denied for user: {request.user}")
            return APIResponse.error(
                message=AI_ERRORS.get("provider_not_authorized", "You don't have permission to view AI settings"),
                status_code=status.HTTP_403_FORBIDDEN
            )
        
        # Log all providers first
        all_providers = AIImageGeneration.objects.all().values('id', 'provider_name', 'is_active', 'api_key')
        logger.info(f"[AI Image View] All providers in DB: {list(all_providers)}")
        print(f"[AI Image View] All providers in DB: {list(all_providers)}")
        
        providers = AIImageGeneration.objects.filter(
            is_active=True
        ).exclude(
            provider_name='gemini'
        )
        
        logger.info(f"[AI Image View] Active providers (excluding gemini): {[(p.id, p.provider_name, p.is_active, bool(p.api_key)) for p in providers]}")
        print(f"[AI Image View] Active providers (excluding gemini): {[(p.id, p.provider_name, p.is_active, bool(p.api_key)) for p in providers]}")
        
        serializer = AIImageGenerationListSerializer(providers, many=True)
        
        available_providers = [
            p for p in serializer.data 
            if p.get('can_generate', False) is True
        ]
        
        logger.info(f"[AI Image View] Returning {len(available_providers)} available providers: {available_providers}")
        print(f"[AI Image View] Returning {len(available_providers)} available providers: {available_providers}")
        
        return APIResponse.success(
            message=AI_SUCCESS["providers_list_retrieved"],
            data=available_providers
        )
    
    @action(detail=False, methods=['get'], url_path='openrouter-models')
    def openrouter_models(self, request):
        """
        Get list of available OpenRouter models for image generation
        
        Query params:
            - use_cache: Whether to use cache (default: true)
        
        Cache:
            - Cached for 6 hours
            - Use ?use_cache=false to force fresh data
        """
        import logging
        logger = logging.getLogger(__name__)
        
        logger.info(f"[AI Image View] openrouter_models called by user: {request.user}")
        print(f"[AI Image View] openrouter_models called by user: {request.user}")
        
        # Check permission
        if not PermissionValidator.has_permission(request.user, 'ai.manage'):
            return APIResponse.error(
                message="شما دسترسی لازم برای مشاهده مدل‌های OpenRouter را ندارید",
                status_code=status.HTTP_403_FORBIDDEN
            )
        
        try:
            from src.ai.providers.openrouter import OpenRouterProvider
            from src.ai.models.admin_ai_settings import AdminAISettings
            from src.ai.models.image_generation import AIImageGeneration
            
            # Get API key for OpenRouter
            try:
                api_key = AdminAISettings.get_api_key_for_admin(request.user, 'openrouter')
            except:
                # Fallback to shared API key
                shared_provider = AIImageGeneration.get_active_provider('openrouter')
                if not shared_provider:
                    return APIResponse.error(
                        message="OpenRouter فعال نیست یا API Key تنظیم نشده است",
                        status_code=status.HTTP_400_BAD_REQUEST
                    )
                api_key = shared_provider.get_api_key()
            
            # Get query params
            use_cache = request.query_params.get('use_cache', 'true').lower() != 'false'
            
            # Get available models from OpenRouter (with cache)
            # Note: For image generation, we might want to filter by image-capable models
            models = OpenRouterProvider.get_available_models(
                api_key, 
                provider_filter=None,  # Get all models
                use_cache=use_cache
            )
            
            # Filter to only image generation models (DALL-E, Flux, Stability, etc.)
            image_models = [
                m for m in models 
                if any(keyword in m['id'].lower() for keyword in ['dall-e', 'flux', 'stable', 'midjourney'])
            ]
            
            logger.info(f"[AI Image View] Found {len(image_models)} image generation models (cache: {use_cache})")
            print(f"[AI Image View] Found {len(image_models)} image generation models (cache: {use_cache})")
            
            return APIResponse.success(
                message="لیست مدل‌های تولید تصویر OpenRouter دریافت شد" + (" (از کش)" if use_cache else " (تازه)"),
                data=image_models,
                status_code=status.HTTP_200_OK
            )
        except Exception as e:
            logger.error(f"[AI Image View] Error getting OpenRouter models: {str(e)}", exc_info=True)
            print(f"[AI Image View] Error getting OpenRouter models: {str(e)}")
            return APIResponse.error(
                message=f"خطا در دریافت لیست مدل‌های OpenRouter: {str(e)}",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'], url_path='clear-openrouter-cache')
    def clear_openrouter_cache(self, request):
        """
        Clear OpenRouter models cache
        
        Permission: ai.manage (فقط برای کسانی که دسترسی مدیریت AI دارند)
        """
        import logging
        logger = logging.getLogger(__name__)
        
        # Check permission - فقط کسانی که ai.manage دارند
        if not PermissionValidator.has_permission(request.user, 'ai.manage'):
            return APIResponse.error(
                message="شما دسترسی لازم برای پاک کردن کش مدل‌ها را ندارید",
                status_code=status.HTTP_403_FORBIDDEN
            )
        
        try:
            from src.ai.providers.openrouter import OpenRouterModelCache
            
            # Clear all cache
            OpenRouterModelCache.clear_all()
            message = "کش تمام مدل‌های OpenRouter پاک شد"
            
            logger.info(f"[AI Image View] {message}")
            print(f"[AI Image View] {message}")
            
            return APIResponse.success(
                message=message,
                status_code=status.HTTP_200_OK
            )
        except Exception as e:
            logger.error(f"[AI Image View] Error clearing cache: {str(e)}", exc_info=True)
            return APIResponse.error(
                message=f"خطا در پاک کردن کش: {str(e)}",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'], url_path='activate')
    def activate_provider(self, request, pk=None, id=None):
        """
        Activate Provider
        """
        provider = self.get_object()
        
        if not provider.api_key:
            return APIResponse.error(
                message=AI_ERRORS["api_key_required"],
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            provider.activate()
            serializer = self.get_serializer(provider)
            return APIResponse.success(
                message=AI_SUCCESS["provider_activated"],
                data=serializer.data
            )
        except Exception as e:
            error_message = str(e)
            if any(key in error_message for key in ['خطا', 'Provider', 'API key']):
                return APIResponse.error(
                    message=error_message,
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            return APIResponse.error(
                message=AI_ERRORS["activation_failed"].format(error=error_message),
                status_code=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'], url_path='deactivate')
    def deactivate_provider(self, request, pk=None, id=None):
        """
        Deactivate Provider
        """
        provider = self.get_object()
        provider.deactivate()
        serializer = self.get_serializer(provider)
        return APIResponse.success(
            message=AI_SUCCESS["provider_deactivated"],
            data=serializer.data
        )
    
    @action(detail=True, methods=['post'], url_path='validate-api-key')
    def validate_api_key(self, request, pk=None):
        """
        Validate API key
        """
        provider = self.get_object()
        
        if not provider.api_key:
            return APIResponse.error(
                message=AI_ERRORS["api_key_not_provided"],
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            is_valid = AIImageGenerationService.validate_provider_api_key(
                provider.provider_name,
                provider.get_api_key()
            )
            
            message = AI_SUCCESS["api_key_valid"] if is_valid else AI_ERRORS["api_key_invalid"]
            return APIResponse.success(
                message=message,
                data={'valid': is_valid}
            )
        except Exception as e:
            error_message = str(e)
            if any(key in error_message for key in ['خطا', 'Provider', 'API key']):
                return APIResponse.error(
                    message=error_message,
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            return APIResponse.error(
                message=AI_ERRORS["validation_error"].format(error=error_message),
                status_code=status.HTTP_400_BAD_REQUEST
            )


class AIImageGenerationRequestViewSet(viewsets.ViewSet):
    """
    ViewSet for generating images with AI
    """
    authentication_classes = [CSRFExemptSessionAuthentication]
    permission_classes = [AiManagerAccess]
    
    @action(detail=False, methods=['post'], url_path='generate')
    def generate_image(self, request):
        """Generate image with AI"""
        if not PermissionValidator.has_permission(request.user, 'ai.image.manage'):
            return APIResponse.error(
                message=AI_ERRORS.get("image_not_authorized", "You don't have permission to generate AI images"),
                status_code=status.HTTP_403_FORBIDDEN
            )
        serializer = AIImageGenerationRequestSerializer(data=request.data)
        
        if not serializer.is_valid():
            return APIResponse.error(
                message=AI_ERRORS["prompt_invalid"],
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        validated_data = serializer.validated_data
        save_to_db = validated_data.get('save_to_db', False)
        
        try:
            if save_to_db:
                with transaction.atomic():
                    media = AIImageGenerationService.generate_and_save_to_media(
                        provider_name=validated_data['provider_name'],
                        prompt=validated_data['prompt'],
                        user_id=request.user.id if hasattr(request.user, 'id') else None,
                        title=validated_data.get('title'),
                        alt_text=validated_data.get('alt_text'),
                        size=validated_data.get('size', '1024x1024'),
                        quality=validated_data.get('quality', 'standard'),
                        save_to_db=True,
                        admin=request.user,  # ✅ Pass admin for personal/shared API selection
                    )
                    
                    from src.media.serializers.media_serializer import MediaAdminSerializer
                    media_serializer = MediaAdminSerializer(media)
                    
                    return APIResponse.success(
                        message=AI_SUCCESS["image_generated_and_saved"],
                        data={
                            **media_serializer.data,
                            'saved': True
                        },
                        status_code=status.HTTP_201_CREATED
                    )
            else:
                image_bytes, metadata = AIImageGenerationService.generate_image_only(
                    provider_name=validated_data['provider_name'],
                    prompt=validated_data['prompt'],
                    size=validated_data.get('size', '1024x1024'),
                    quality=validated_data.get('quality', 'standard'),
                    admin=request.user,  # ✅ Pass admin for personal/shared API selection
                )
                
                import base64
                image_base64 = base64.b64encode(image_bytes.getvalue()).decode('utf-8')
                image_data_url = f"data:image/png;base64,{image_base64}"
                
                return APIResponse.success(
                    message=AI_SUCCESS["image_generated_not_saved"],
                    data={
                        'image_data_url': image_data_url,
                        'prompt': metadata['prompt'],
                        'provider_name': metadata['provider_name'],
                        'filename': metadata['filename'],
                        'title': validated_data.get('title'),
                        'alt_text': validated_data.get('alt_text'),
                        'saved': False
                    },
                    status_code=status.HTTP_200_OK
                )
            
        except ValueError as e:
            error_message = str(e)
            if any(key in error_message for key in ['خطا', 'Provider', 'API key', 'فعال نیست']):
                return APIResponse.error(
                    message=error_message,
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            final_message = AI_ERRORS["provider_not_available"].format(provider_name=error_message) if 'Provider' in error_message else AI_ERRORS["image_generation_failed"].format(error=error_message)
            return APIResponse.error(
                message=final_message,
                status_code=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return APIResponse.error(
                message=AI_ERRORS["image_generation_failed"].format(error=str(e)),
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )















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


        from rest_framework import serializers
from src.ai.models.image_generation import AIImageGeneration
from src.ai.messages.messages import AI_ERRORS


class AIImageGenerationSerializer(serializers.ModelSerializer):
    """Serializer for managing AI model API keys"""
    
    provider_display = serializers.CharField(
        source='get_provider_name_display',
        read_only=True
    )
    
    has_api_key = serializers.SerializerMethodField()
    
    class Meta:
        model = AIImageGeneration
        fields = [
            'id',
            'provider_name',
            'provider_display',
            'api_key',
            'has_api_key',
            'is_active',
            'config',
            'usage_count',
            'last_used_at',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'usage_count',
            'last_used_at',
            'created_at',
            'updated_at',
        ]
    
    def get_has_api_key(self, obj) -> bool:
        """Check if API key is entered"""
        return bool(obj.api_key)
    
    def validate(self, attrs):
        """Validation"""
        api_key = attrs.get('api_key')
        provider_name = attrs.get('provider_name') or (self.instance.provider_name if self.instance else None)
        
        if api_key and api_key != '***' and api_key.strip():
            if self.instance and self.instance.api_key and api_key == '***':
                return attrs
            
            from src.ai.services.image_generation_service import AIImageGenerationService
            try:
                is_valid = AIImageGenerationService.validate_provider_api_key(
                    provider_name,
                    api_key.strip()
                )
                
                if not is_valid:
                    attrs['is_active'] = False
                else:
                    attrs['is_active'] = True
            except Exception as e:
                attrs['is_active'] = False
        
        return attrs
    
    def to_representation(self, instance):
        """Hide API key in response"""
        data = super().to_representation(instance)
        if 'api_key' in data:
            data['api_key'] = '***' if instance.api_key else None
        return data


class AIImageGenerationRequestSerializer(serializers.Serializer):
    """Serializer for image generation request"""
    
    provider_name = serializers.ChoiceField(
        choices=AIImageGeneration.PROVIDER_CHOICES,
        help_text="AI model name (gemini, openai, ...)"
    )
    
    prompt = serializers.CharField(
        max_length=1000,
        help_text="Image description"
    )
    
    title = serializers.CharField(
        max_length=200,
        required=False,
        allow_blank=True,
        help_text="Image title (if not provided, prompt will be used)"
    )
    
    alt_text = serializers.CharField(
        max_length=500,
        required=False,
        allow_blank=True,
        help_text="Image alt text"
    )
    
    size = serializers.CharField(
        max_length=20,
        required=False,
        default='1024x1024',
        help_text="Image size (e.g., 1024x1024, 512x512)"
    )
    
    quality = serializers.CharField(
        max_length=20,
        required=False,
        default='standard',
        help_text="Image quality (standard, hd)"
    )
    
    save_to_db = serializers.BooleanField(
        required=False,
        default=False,
        help_text="Save image to database? (default: false - only generate)"
    )
    
    def validate_provider_name(self, value):
        """Validate that provider is active and can generate images"""
        if value == 'gemini':
            raise serializers.ValidationError(AI_ERRORS["gemini_not_implemented"])
        
        if not AIImageGeneration.is_provider_available(value):
            raise serializers.ValidationError(
                AI_ERRORS["provider_not_available"].format(provider_name=value)
            )
        return value
    
    def validate_prompt(self, value):
        """Validate prompt"""
        if not value or not value.strip():
            raise serializers.ValidationError(AI_ERRORS["prompt_required"])
        return value.strip()


class AIImageGenerationListSerializer(serializers.ModelSerializer):
    """Simple serializer for listing Providers"""
    
    provider_display = serializers.CharField(
        source='get_provider_name_display',
        read_only=True
    )
    
    has_api_key = serializers.SerializerMethodField()
    can_generate = serializers.SerializerMethodField()
    config = serializers.SerializerMethodField()
    
    class Meta:
        model = AIImageGeneration
        fields = [
            'id',
            'provider_name',
            'provider_display',
            'has_api_key',
            'is_active',
            'can_generate',
            'usage_count',
            'last_used_at',
            'config',  # Include config for OpenRouter model settings
        ]
    
    def get_has_api_key(self, obj) -> bool:
        return bool(obj.api_key)
    
    def get_can_generate(self, obj) -> bool:
        """Can images be generated with this Provider?"""
        if obj.provider_name == 'gemini':
            return False
        return obj.is_active and bool(obj.api_key)
    
    def get_config(self, obj) -> dict:
        """Get config field, return empty dict if None"""
        if obj.config is None:
            return {}
        if isinstance(obj.config, dict):
            return obj.config
        return {}