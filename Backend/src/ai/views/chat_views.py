from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated

from src.core.responses.response import APIResponse
from src.ai.services.chat_service import AIChatService
from src.ai.serializers.chat_serializer import (
    AIChatRequestSerializer,
    AIChatResponseSerializer,
)
from src.ai.messages.messages import AI_SUCCESS, AI_ERRORS
from src.user.access_control import ai_permission, PermissionRequiredMixin
from src.ai.providers.capabilities import get_provider_capabilities, supports_feature, PROVIDER_CAPABILITIES
from src.ai.providers.registry import AIProviderRegistry
from src.ai.models import AIProvider
from src.ai.services.provider_access_service import ProviderAccessService
from src.ai.utils.error_mapper import map_ai_exception
from src.core.utils.validation_helpers import extract_validation_message

class AIChatViewSet(PermissionRequiredMixin, viewsets.ViewSet):
    permission_classes = [ai_permission]
    
    permission_map = {
        'send_message': ['ai.chat.manage', 'ai.manage'],  # Check if user has ai.chat.manage OR ai.manage
        'available_providers': ['ai.chat.manage', 'ai.manage'],
    }
    permission_denied_message = AI_ERRORS["chat_not_authorized"]
    
    @action(detail=False, methods=['post'], url_path='send-message')
    def send_message(self, request):
        """
        Send a message to AI chat.
        
        View Layer Responsibility:
        - Validate request (Serializer)
        - Call business logic (Service)
        - Handle exceptions
        - Return formatted response (APIResponse)
        """
        # --- 1. Validation (Serializer Layer) ---
        serializer = AIChatRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return APIResponse.error(
                message=AI_ERRORS["validation_error"],
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        validated_data = serializer.validated_data
        
        try:
            # Prepare conversation history
            conversation_history = None
            if validated_data.get('conversation_history'):
                conversation_history = [
                    {'role': msg['role'], 'content': msg['content']}
                    for msg in validated_data['conversation_history']
                ]
            
            provider_name = validated_data.get('provider_name')
            model_id = validated_data.get('model_id')
            
            # --- 2. Business Logic (Service Layer) ---
            chat_data = AIChatService.chat(
                message=validated_data['message'],
                provider_name=provider_name,
                model_name=model_id,
                conversation_history=conversation_history,
                system_message=validated_data.get('system_message'),
                temperature=validated_data.get('temperature', 0.7),
                max_tokens=validated_data.get('max_tokens', 2048),
                image=validated_data.get('image'),
                admin=request.user,
            )
            
            # --- 3. Response Serialization ---
            response_serializer = AIChatResponseSerializer(chat_data)
            
            # --- 4. Success Response ---
            return APIResponse.success(
                message=AI_SUCCESS["message_sent"],
                data=response_serializer.data,
                status_code=status.HTTP_200_OK
            )
            
        except ValueError as e:
            # Service raises ValueError for business logic errors
            return APIResponse.error(
                message=extract_validation_message(e, AI_ERRORS["validation_error"]),
                status_code=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            final_msg, status_code = map_ai_exception(e, AI_ERRORS["chat_failed"])

            return APIResponse.error(
                message=final_msg,
                status_code=status_code
            )
    
    @action(detail=False, methods=['get'], url_path='capabilities')
    def get_capabilities(self, request):
        provider_name = request.query_params.get('provider_name')
        
        if provider_name:
            caps = get_provider_capabilities(provider_name)
            if not supports_feature(provider_name, 'chat'):
                return APIResponse.error(
                    message=AI_ERRORS["provider_not_supported"],
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            return APIResponse.success(
                message=AI_SUCCESS["capabilities_retrieved"].format(provider_name=provider_name),
                data=caps,
                status_code=status.HTTP_200_OK
            )
        else:
            chat_providers = {
                name: caps for name, caps in PROVIDER_CAPABILITIES.items()
                if caps.get('supports_chat', False)
            }
            return APIResponse.success(
                message=AI_SUCCESS["all_capabilities_retrieved"],
                data=chat_providers,
                status_code=status.HTTP_200_OK
            )
    
    @action(detail=False, methods=['get'], url_path='available-providers')
    def available_providers(self, request):
        """Returns providers that support chat with their hardcoded models."""
        is_super = getattr(request.user, 'is_superuser', False) or getattr(request.user, 'is_admin_full', False)
        
        try:
            providers_qs = AIProvider.objects.filter(is_active=True).order_by('sort_order', 'display_name')
            
            result = []
            for provider in providers_qs:
                # Check if provider supports chat
                if not provider.supports_capability('chat'):
                    continue
                
                has_access = self._check_provider_access(request.user, provider, is_super)
                
                provider_info = {
                    'id': provider.id,
                    'slug': provider.slug,
                    'provider_name': provider.display_name,
                    'display_name': provider.display_name,
                    'description': provider.description,
                    'has_access': has_access,
                    'capabilities': provider.capabilities,  # Include hardcoded models
                }
                result.append(provider_info)
            
            return APIResponse.success(
                message=AI_SUCCESS["providers_list_retrieved"],
                data=result,
                status_code=status.HTTP_200_OK
            )
        except Exception as e:
            return APIResponse.error(
                message=AI_ERRORS["providers_list_error"],
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def _check_provider_access(self, user, provider, is_super: bool) -> bool:
        return ProviderAccessService.can_admin_access_provider(
            user=user,
            provider=provider,
            is_super=is_super,
        )

