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

