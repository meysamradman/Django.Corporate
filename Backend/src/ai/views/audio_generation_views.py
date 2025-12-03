from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from django.db import transaction

from src.ai.models import AIProvider
from src.ai.serializers.audio_generation_serializer import AIAudioGenerationRequestSerializer
from src.ai.services.audio_generation_service import AIAudioGenerationService
from src.media.serializers.media_serializer import MediaAdminSerializer
from src.ai.messages.messages import AI_SUCCESS, AI_ERRORS
from src.user.auth.admin_session_auth import CSRFExemptSessionAuthentication
from src.core.responses import APIResponse
from src.user.authorization import AiManagerAccess
from src.user.permissions import PermissionValidator
import base64


class AIAudioGenerationRequestViewSet(viewsets.ViewSet):
    authentication_classes = [CSRFExemptSessionAuthentication]
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'], url_path='available-providers')
    def available_providers(self, request):
        has_audio_permission = PermissionValidator.has_permission(request.user, 'ai.audio.manage')
        has_manage_permission = PermissionValidator.has_permission(request.user, 'ai.manage')
        has_permission = has_audio_permission or has_manage_permission
        
        if not has_permission:
            return APIResponse.error(
                message=AI_ERRORS["audio_not_authorized"],
                status_code=status.HTTP_403_FORBIDDEN
            )
        
        try:
            providers = AIAudioGenerationService.get_available_providers()
            return APIResponse.success(
                message=AI_SUCCESS["providers_list_retrieved"],
                data=providers,
                status_code=status.HTTP_200_OK
            )
        except Exception as e:
            return APIResponse.error(
                message=AI_ERRORS["providers_list_error"].format(error=str(e)),
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'], url_path='generate')
    def generate_audio(self, request):
        has_audio_permission = PermissionValidator.has_permission(request.user, 'ai.audio.manage')
        has_manage_permission = PermissionValidator.has_permission(request.user, 'ai.manage')
        has_permission = has_audio_permission or has_manage_permission
        
        if not has_permission:
            return APIResponse.error(
                message=AI_ERRORS["audio_not_authorized"],
                status_code=status.HTTP_403_FORBIDDEN
            )
        
        serializer = AIAudioGenerationRequestSerializer(data=request.data)
        
        if not serializer.is_valid():
            return APIResponse.error(
                message=AI_ERRORS["validation_error"],
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        validated_data = serializer.validated_data
        save_to_db = validated_data.get('save_to_db', False)
        
        try:
            if save_to_db:
                with transaction.atomic():
                    media = AIAudioGenerationService.generate_and_save_to_media(
                        provider_name=validated_data['provider_name'],
                        text=validated_data['text'],
                        user_id=request.user.id if hasattr(request.user, 'id') else None,
                        title=validated_data.get('title'),
                        save_to_db=True,
                        admin=request.user,
                        model=validated_data.get('model', 'tts-1'),
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
                    provider_name=validated_data['provider_name'],
                    text=validated_data['text'],
                    model=validated_data.get('model', 'tts-1'),
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
            return APIResponse.error(
                message=AI_ERRORS["audio_generation_failed"].format(error=str(e)),
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

