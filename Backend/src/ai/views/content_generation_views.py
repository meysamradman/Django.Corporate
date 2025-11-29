from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils.translation import gettext_lazy as _

from src.core.responses.response import APIResponse
from src.ai.services.content_generation_service import AIContentGenerationService
from src.ai.serializers.content_generation_serializer import (
    AIContentGenerationRequestSerializer,
    AIContentGenerationResponseSerializer
)
from src.ai.messages.messages import AI_SUCCESS, AI_ERRORS
from src.user.permissions import PermissionValidator
from src.ai.providers.capabilities import get_provider_capabilities, supports_feature


class AIContentGenerationViewSet(viewsets.ViewSet):
    """
    ViewSet for AI Content Generation
    """
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'], url_path='capabilities')
    def get_capabilities(self, request):
        """
        Get capabilities for all providers or a specific provider for Content Generation
        
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
            # Check if provider supports content generation
            if not supports_feature(provider_name, 'content'):
                return APIResponse.error(
                    message=f"{provider_name} از قابلیت تولید محتوا پشتیبانی نمی‌کند",
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            return APIResponse.success(
                message=f"قابلیت‌های تولید محتوا برای {provider_name} دریافت شد",
                data=caps,
                status_code=status.HTTP_200_OK
            )
        else:
            # Get all capabilities for providers that support content generation
            from src.ai.providers.capabilities import PROVIDER_CAPABILITIES
            content_providers = {
                name: caps for name, caps in PROVIDER_CAPABILITIES.items()
                if caps.get('supports_content', False)
            }
            return APIResponse.success(
                message="قابلیت‌های تولید محتوا تمام Provider ها دریافت شد",
                data=content_providers,
                status_code=status.HTTP_200_OK
            )
    
    @action(detail=False, methods=['get'], url_path='available-providers')
    def available_providers(self, request):
        """Get list of available content generation providers"""
        import logging
        logger = logging.getLogger(__name__)
        
        logger.info(f"[AI Content View] available_providers called by user: {request.user}")
        print(f"[AI Content View] available_providers called by user: {request.user}")
        
        # Check permission with fallback - allow ai.manage or ai.content.manage
        has_content_permission = PermissionValidator.has_permission(request.user, 'ai.content.manage')
        has_manage_permission = PermissionValidator.has_permission(request.user, 'ai.manage')
        has_permission = has_content_permission or has_manage_permission
        
        logger.info(f"[AI Content View] Permission check: ai.content.manage={has_content_permission}, ai.manage={has_manage_permission}")
        print(f"[AI Content View] Permission check: ai.content.manage={has_content_permission}, ai.manage={has_manage_permission}")
        
        if not has_permission:
            logger.warning(f"[AI Content View] Permission denied for user: {request.user}")
            print(f"[AI Content View] Permission denied for user: {request.user}")
            return APIResponse.error(
                message=AI_ERRORS.get("content_not_authorized", "You don't have permission to view AI content providers"),
                status_code=status.HTTP_403_FORBIDDEN
            )
        try:
            logger.info("[AI Content View] Getting available providers...")
            print("[AI Content View] Getting available providers...")
            providers = AIContentGenerationService.get_available_providers(admin=request.user)
            logger.info(f"[AI Content View] Found {len(providers)} providers: {providers}")
            print(f"[AI Content View] Found {len(providers)} providers: {providers}")
            return APIResponse.success(
                message=AI_SUCCESS["providers_list_retrieved"],
                data=providers,
                status_code=status.HTTP_200_OK
            )
        except Exception as e:
            logger.error(f"[AI Content View] Error: {str(e)}", exc_info=True)
            return APIResponse.error(
                message=f"خطا در دریافت لیست Provider ها: {str(e)}",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'], url_path='openrouter-models')
    def openrouter_models(self, request):
        """
        Get list of available OpenRouter models for content generation
        
        Query params:
            - use_cache: Whether to use cache (default: true)
        
        Cache:
            - Cached for 6 hours
            - Use ?use_cache=false to force fresh data
        """
        import logging
        logger = logging.getLogger(__name__)
        
        logger.info(f"[AI Content View] openrouter_models called by user: {request.user}")
        print(f"[AI Content View] openrouter_models called by user: {request.user}")
        
        # Check permission
        has_content_permission = PermissionValidator.has_permission(request.user, 'ai.content.manage')
        has_manage_permission = PermissionValidator.has_permission(request.user, 'ai.manage')
        has_permission = has_content_permission or has_manage_permission
        
        if not has_permission:
            return APIResponse.error(
                message="شما دسترسی لازم برای مشاهده مدل‌های OpenRouter را ندارید",
                status_code=status.HTTP_403_FORBIDDEN
            )
        
        try:
            from src.ai.providers.openrouter import OpenRouterProvider
            from src.ai.models import AIProvider, AdminProviderSettings
            
            # Get API key for OpenRouter
            try:
                provider = AIProvider.objects.get(slug='openrouter', is_active=True)
            except AIProvider.DoesNotExist:
                return APIResponse.error(
                    message="OpenRouter فعال نیست. لطفاً ابتدا OpenRouter را در تنظیمات AI فعال کنید.",
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            
            # ✅ بهینه: منطق ساده و واضح برای دریافت API key
            # ✅ بهینه شده: استفاده از select_related برای جلوگیری از N+1 query
            settings = AdminProviderSettings.objects.filter(
                admin=request.user,
                provider=provider,
                is_active=True
            ).select_related('provider').first()
            
            api_key = None
            
            # Strategy 1: اگر settings وجود دارد
            if settings:
                # اول سعی کن از get_api_key() بگیر (طبق use_shared_api)
                try:
                    api_key = settings.get_api_key()
                    logger.info(f"[AI Content API] Using API key from settings (use_shared_api={settings.use_shared_api})")
                except Exception as e:
                    logger.warning(f"[AI Content API] get_api_key() failed: {e}")
                    # اگر use_shared_api=True است اما shared key نیست، personal را چک کن
                    if settings.use_shared_api:
                        # shared API key تنظیم نشده، personal را امتحان کن
                        personal_key = settings.get_personal_api_key()
                        if personal_key and personal_key.strip():
                            api_key = personal_key
                            logger.info(f"[AI Content API] Fallback: Using personal API key")
                        else:
                            logger.warning(f"[AI Content API] Personal API key also empty")
                    else:
                        # use_shared_api=False اما personal هم نیست
                        logger.warning(f"[AI Content API] Personal API key not set")
            
            # Strategy 2: اگر هنوز API key نداریم، shared provider را چک کن
            if not api_key or not api_key.strip():
                shared_key = provider.get_shared_api_key()
                if shared_key and shared_key.strip():
                    api_key = shared_key
                    logger.info(f"[AI Content API] Using shared provider API key")
                else:
                    logger.warning(f"[AI Content API] Shared provider API key also empty")
            
            # Get query params
            use_cache = request.query_params.get('use_cache', 'true').lower() != 'false'
            
            # ✅ داینامیک: همیشه از OpenRouter API می‌گیریم (حتی بدون API key)
            # OpenRouter API ممکن است لیست مدل‌ها را بدون auth هم بدهد
            final_api_key = api_key if (api_key and api_key.strip()) else None
            models = OpenRouterProvider.get_available_models(
                api_key=final_api_key, 
                provider_filter=None,  # Get all text generation models
                use_cache=use_cache
            )
            
            logger.info(f"[AI Content View] Found {len(models)} content generation models (cache: {use_cache})")
            print(f"[AI Content View] Found {len(models)} content generation models (cache: {use_cache})")
            
            return APIResponse.success(
                message="لیست مدل‌های تولید محتوا OpenRouter دریافت شد" + (" (از کش)" if use_cache else " (تازه)"),
                data=models,
                status_code=status.HTTP_200_OK
            )
        except Exception as e:
            logger.error(f"[AI Content View] Error getting OpenRouter models: {str(e)}", exc_info=True)
            print(f"[AI Content View] Error getting OpenRouter models: {str(e)}")
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
            
            logger.info(f"[AI Content View] {message}")
            print(f"[AI Content View] {message}")
            
            return APIResponse.success(
                message=message,
                status_code=status.HTTP_200_OK
            )
        except Exception as e:
            logger.error(f"[AI Content View] Error clearing cache: {str(e)}", exc_info=True)
            return APIResponse.error(
                message=f"خطا در پاک کردن کش: {str(e)}",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'], url_path='generate')
    def generate_content(self, request):
        """Generate SEO-optimized content"""
        # Check permission with fallback - allow ai.manage or ai.content.manage
        has_content_permission = PermissionValidator.has_permission(request.user, 'ai.content.manage')
        has_manage_permission = PermissionValidator.has_permission(request.user, 'ai.manage')
        has_permission = has_content_permission or has_manage_permission
        
        if not has_permission:
            return APIResponse.error(
                message=AI_ERRORS.get("content_not_authorized", "You don't have permission to generate AI content"),
                status_code=status.HTTP_403_FORBIDDEN
            )
        serializer = AIContentGenerationRequestSerializer(data=request.data)
        
        if not serializer.is_valid():
            return APIResponse.error(
                message="خطا در اعتبارسنجی داده‌ها",
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        validated_data = serializer.validated_data
        
        # ✅ Extract destination info
        destination = validated_data.get('destination', 'direct')
        destination_data = validated_data.get('destination_data', {})
        
        try:
            # Generate content
            content_data = AIContentGenerationService.generate_content(
                topic=validated_data['topic'],
                provider_name=validated_data.get('provider_name', 'gemini'),
                word_count=validated_data.get('word_count', 500),
                tone=validated_data.get('tone', 'professional'),
                keywords=validated_data.get('keywords', []),
                admin=request.user,
            )
            
            # ✅ Handle destination
            from src.ai.services.destination_handler import ContentDestinationHandler
            
            try:
                destination_result = ContentDestinationHandler.save_to_destination(
                    content_data=content_data,
                    destination=destination,
                    destination_data=destination_data,
                    admin=request.user
                )
            except ValueError as dest_error:
                # خطا در ذخیره‌سازی
                return APIResponse.error(
                    message=str(dest_error),
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            
            # ✅ مرتب کردن response
            response_data = {
                'content': content_data,  # محتوای تولید شده
                'destination': destination_result,  # نتیجه ذخیره‌سازی
            }
            
            # ✅ Success message based on destination
            if destination_result['saved']:
                message = f"{AI_SUCCESS['content_generated']} {destination_result['message']}"
            else:
                message = AI_SUCCESS['content_generated']
            
            return APIResponse.success(
                message=message,
                data=response_data,
                status_code=status.HTTP_200_OK
            )
            
        except ValueError as e:
            return APIResponse.error(
                message=str(e),
                status_code=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            error_message = str(e)
            if 'خطا' not in error_message:
                error_message = AI_ERRORS["content_generation_failed"].format(error=error_message)
            return APIResponse.error(
                message=error_message,
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

