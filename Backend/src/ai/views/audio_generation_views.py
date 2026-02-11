from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from django.db import transaction

from src.ai.models import AIProvider, AdminProviderSettings
from src.ai.utils.state_machine import ModelAccessState
from src.ai.serializers.audio_generation_serializer import AIAudioGenerationRequestSerializer
from src.ai.services.audio_generation_service import AIAudioGenerationService
from src.media.serializers.media_serializer import MediaAdminSerializer
from src.ai.messages.messages import AI_SUCCESS, AI_ERRORS
from src.user.auth.admin_session_auth import CSRFExemptSessionAuthentication
from src.core.responses.response import APIResponse
from src.user.access_control import ai_permission, PermissionRequiredMixin
from src.ai.providers.registry import AIProviderRegistry
import base64
import logging

logger = logging.getLogger(__name__)

class AIAudioGenerationRequestViewSet(PermissionRequiredMixin, viewsets.ViewSet):
    authentication_classes = [CSRFExemptSessionAuthentication]
    permission_classes = [ai_permission]
    
    permission_map = {
        'available_providers': ['ai.audio.manage', 'ai.manage'],  # Check if user has ai.audio.manage OR ai.manage
        'generate_audio': ['ai.audio.manage', 'ai.manage'],
    }
    permission_denied_message = AI_ERRORS["audio_not_authorized"]
    
    @action(detail=False, methods=['get'], url_path='available-providers')
    def available_providers(self, request):
        is_super = getattr(request.user, 'is_superuser', False) or getattr(request.user, 'is_admin_full', False)
        
        try:
            providers_qs = AIProvider.objects.filter(is_active=True).order_by('sort_order', 'display_name')
            
            result = []
            for provider in providers_qs:
                has_access = self._check_provider_access(request.user, provider, is_super)
                
                provider_info = {
                    'id': provider.id,
                    'slug': provider.slug,
                    'name': provider.display_name,
                    'description': provider.description,
                    'has_access': has_access,
                }
                result.append(provider_info)
            
            return APIResponse.success(
                message=AI_SUCCESS["providers_list_retrieved"],
                data=result,
                status_code=status.HTTP_200_OK
            )
        except Exception as e:
            return APIResponse.error(
                message=AI_ERRORS["providers_list_error"].format(error=str(e)),
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def _check_provider_access(self, user, provider, is_super: bool) -> bool:
        if is_super and provider.shared_api_key:
            return True
        
        personal_settings = AdminProviderSettings.objects.filter(
            admin=user,
            provider=provider,
            is_active=True,
            personal_api_key__isnull=False
        ).exclude(personal_api_key='').first()
        
        if personal_settings:
            return True
        
        if provider.allow_shared_for_normal_admins and provider.shared_api_key:
            return True
        
        return False
    
    @action(detail=False, methods=['post'], url_path='generate')
    def generate_audio(self, request):
        serializer = AIAudioGenerationRequestSerializer(data=request.data)
        
        if not serializer.is_valid():
            return APIResponse.error(
                message=AI_ERRORS["validation_error"],
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        validated_data = serializer.validated_data
        save_to_db = validated_data.get('save_to_db', False)

        provider_slug = validated_data.get('provider_name')
        if not provider_slug:
            for candidate in AIProvider.objects.filter(is_active=True).order_by('sort_order', 'display_name'):
                if not AIProviderRegistry.get(candidate.slug):
                    continue
                if not candidate.supports_capability('audio'):
                    continue
                provider_slug = candidate.slug
                break

        if not provider_slug:
            return APIResponse.error(
                message=AI_ERRORS.get('no_active_providers', 'هیچ Provider فعالی یافت نشد'),
                status_code=status.HTTP_400_BAD_REQUEST
            )

        try:
            provider = AIProvider.objects.get(slug=provider_slug, is_active=True)
        except AIProvider.DoesNotExist:
            return APIResponse.error(
                message=AI_ERRORS["provider_not_found_or_inactive"].format(provider_name=provider_slug),
                status_code=status.HTTP_400_BAD_REQUEST
            )

        state = ModelAccessState.calculate(provider, None, request.user)
        if state not in [ModelAccessState.AVAILABLE_SHARED, ModelAccessState.AVAILABLE_PERSONAL]:
            return APIResponse.error(
                message=AI_ERRORS["model_access_denied"],
                status_code=status.HTTP_403_FORBIDDEN
            )
        
        try:
            if save_to_db:
                with transaction.atomic():
                    media = AIAudioGenerationService.generate_and_save_to_media(
                        provider_name=provider_slug,
                        text=validated_data['text'],
                        user_id=request.user.id if hasattr(request.user, 'id') else None,
                        title=validated_data.get('title'),
                        save_to_db=True,
                        admin=request.user,
                        voice=validated_data.get('voice', 'alloy'),
                        speed=validated_data.get('speed', 1.0),
                        response_format=validated_data.get('response_format', 'mp3'),
                    )
                    
                    media_serializer = MediaAdminSerializer(media)
                    
                    return APIResponse.success(
                        message=AI_SUCCESS["audio_generated_and_saved"],
                        data={
                            **media_serializer.data,
                            'saved': True
                        },
                        status_code=status.HTTP_201_CREATED
                    )
            else:
                audio_bytes, metadata = AIAudioGenerationService.generate_audio_only(
                    provider_name=provider_slug,
                    text=validated_data['text'],
                    voice=validated_data.get('voice', 'alloy'),
                        speed=validated_data.get('speed', 1.0),
                        response_format=validated_data.get('response_format', 'mp3'),
                        admin=request.user,
                    )
                
                audio_base64 = base64.b64encode(audio_bytes.getvalue()).decode('utf-8')
                audio_data_url = f"data:audio/{validated_data.get('response_format', 'mp3')};base64,{audio_base64}"
                
                return APIResponse.success(
                    message=AI_SUCCESS["audio_generated_not_saved"],
                    data={
                        'audio_data_url': audio_data_url,
                        'text': metadata['text'],
                        'provider_name': metadata['provider_name'],
                        'filename': metadata['filename'],
                        'title': validated_data.get('title'),
                        'saved': False
                    },
                    status_code=status.HTTP_200_OK
                )
            
        except NotImplementedError as e:
            # e.g. provider.text_to_speech not implemented
            logger.warning(
                "AI audio generation not supported by provider",
                extra={
                    'provider': provider_slug,
                    'admin_id': getattr(request.user, 'id', None),
                    'save_to_db': save_to_db,
                }
            )
            return APIResponse.error(
                message=AI_ERRORS.get('provider_tts_not_supported', str(e)).format(provider_name=provider_slug),
                status_code=status.HTTP_400_BAD_REQUEST
            )
        except ValueError as e:
            error_message = str(e)
            if any(key in error_message for key in ['Provider', 'API key', 'not active', 'not supported']):
                return APIResponse.error(
                    message=error_message,
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            final_message = AI_ERRORS["provider_not_available"].format(provider_name=error_message) if 'Provider' in error_message else AI_ERRORS["audio_generation_failed"].format(error=error_message)
            return APIResponse.error(
                message=final_message,
                status_code=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.exception(
                "AI audio generation failed",
                extra={
                    'provider': provider_slug,
                    'admin_id': getattr(request.user, 'id', None),
                    'save_to_db': save_to_db,
                }
            )
            return APIResponse.error(
                message=AI_ERRORS["audio_generation_failed"].format(error=str(e)),
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

