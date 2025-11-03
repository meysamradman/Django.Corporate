from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
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


class AIImageGenerationProviderViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing API keys and AI model settings
    """
    authentication_classes = [CSRFExemptSessionAuthentication]
    permission_classes = [IsAuthenticated]
    queryset = AIImageGeneration.objects.all()
    serializer_class = AIImageGenerationSerializer
    lookup_field = 'id'
    
    def get_queryset(self):
        """Filter queryset"""
        return AIImageGeneration.objects.all().order_by('-created_at')
    
    def update(self, request, *args, **kwargs):
        """Update method override"""
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
        """Create or update Provider"""
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
    
    @action(detail=False, methods=['get'], url_path='available')
    def available_providers(self, request):
        """
        Get list of active providers (that have API key and are active)
        """
        providers = AIImageGeneration.objects.filter(
            is_active=True
        ).exclude(
            provider_name='gemini'
        )
        
        serializer = AIImageGenerationListSerializer(providers, many=True)
        
        available_providers = [
            p for p in serializer.data 
            if p.get('can_generate', False) is True
        ]
        
        return APIResponse.success(
            message=AI_SUCCESS["providers_list_retrieved"],
            data=available_providers
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
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['post'], url_path='generate')
    def generate_image(self, request):
        """Generate image with AI"""
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

