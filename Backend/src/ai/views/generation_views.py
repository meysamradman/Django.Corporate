from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.core.cache import cache

from src.ai.models import AIProvider, AIModel, AdminProviderSettings
from src.ai.services.state_machine import ModelAccessState
from src.ai.services.content_generation_service import AIContentGenerationService
from src.ai.serializers.content_generation_serializer import (
    AIContentGenerationRequestSerializer,
    AIContentGenerationResponseSerializer
)
from src.core.responses import APIResponse
from src.ai.messages.messages import AI_ERRORS, AI_SUCCESS


class AIGenerationViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['post'], url_path='text')
    def generate_text(self, request):
        serializer = AIContentGenerationRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return APIResponse.error(
                message=AI_ERRORS.get("prompt_invalid", "Invalid request data"),
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        data = serializer.validated_data
        model_id = data.get('model_id')
        
        try:
            model = AIModel.objects.select_related('provider').get(id=model_id)
            
            state = ModelAccessState.calculate(model.provider, model, request.user)
            if state not in [ModelAccessState.AVAILABLE_SHARED, ModelAccessState.AVAILABLE_PERSONAL]:
                return APIResponse.error(
                    message=AI_ERRORS.get("model_access_denied", "You don't have access to this model"),
                    status_code=status.HTTP_403_FORBIDDEN
                )
            
            if 'chat' not in model.capabilities and 'text' not in model.capabilities:
                return APIResponse.error(
                    message=AI_ERRORS.get("model_no_text_capability", "This model does not support text generation"),
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            
            result = AIContentGenerationService.generate_content(
                topic=data.get('prompt'),
                provider_name=model.provider.slug,
                admin=request.user,
                word_count=data.get('max_tokens', 500),
                tone=data.get('tone', 'professional')
            )
            
            model.increment_usage()
            
            return APIResponse.success(
                message=AI_SUCCESS.get("content_generated", "Content generated successfully"),
                data=result,
                status_code=status.HTTP_200_OK
            )
            
        except AIModel.DoesNotExist:
            return APIResponse.error(
                message=AI_ERRORS.get("model_not_found", "Model not found"),
                status_code=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return APIResponse.error(
                message=AI_ERRORS.get("content_generation_failed", "Content generation failed").format(error=str(e)),
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'], url_path='image')
    def generate_image(self, request):
        from src.ai.serializers.image_generation_serializer import AIImageGenerationRequestSerializer
        from src.ai.services.image_generation_service import AIImageGenerationService
        
        serializer = AIImageGenerationRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return APIResponse.error(
                message=AI_ERRORS.get("prompt_invalid", "Invalid request data"),
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        data = serializer.validated_data
        model_id = data.get('model_id')
        
        try:
            model = AIModel.objects.select_related('provider').get(id=model_id)
            
            state = ModelAccessState.calculate(model.provider, model, request.user)
            if state not in [ModelAccessState.AVAILABLE_SHARED, ModelAccessState.AVAILABLE_PERSONAL]:
                return APIResponse.error(
                    message=AI_ERRORS.get("model_access_denied", "You don't have access to this model"),
                    status_code=status.HTTP_403_FORBIDDEN
                )
            
            if 'image' not in model.capabilities:
                return APIResponse.error(
                    message=AI_ERRORS.get("model_no_image_capability", "This model does not support image generation"),
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            
            import time
            start_time = time.time()
            
            if data.get('save_to_media', True):
                media = AIImageGenerationService.generate_and_save_to_media(
                    provider_name=model.provider.slug,
                    prompt=data.get('prompt'),
                    admin=request.user,
                    title=data.get('title', data.get('prompt')[:100]),
                    alt_text=data.get('alt_text', data.get('prompt')[:200]),
                    save_to_db=True,
                    size=data.get('size', '1024x1024'),
                    quality=data.get('quality', 'standard')
                )
                
                result = {
                    "success": True,
                    "images": [{
                        "url": media.file.url,
                        "media_id": media.id,
                        "size": data.get('size', '1024x1024')
                    }],
                    "provider": model.provider.display_name,
                    "model": model.display_name,
                    "prompt": data.get('prompt'),
                    "generation_time_ms": int((time.time() - start_time) * 1000)
                }
            else:
                image_bytes, metadata = AIImageGenerationService.generate_image_only(
                    provider_name=model.provider.slug,
                    prompt=data.get('prompt'),
                    admin=request.user,
                    size=data.get('size', '1024x1024')
                )
                
                import base64
                image_base64 = base64.b64encode(image_bytes.getvalue()).decode('utf-8')
                
                result = {
                    "success": True,
                    "images": [{
                        "data": f"data:image/png;base64,{image_base64}",
                        "size": data.get('size', '1024x1024')
                    }],
                    "provider": model.provider.display_name,
                    "model": model.display_name,
                    "prompt": data.get('prompt'),
                    "generation_time_ms": int((time.time() - start_time) * 1000)
                }
            
            model.increment_usage()
            
            return APIResponse.success(
                message=AI_SUCCESS.get("image_generated", "Image generated successfully"),
                data=result,
                status_code=status.HTTP_200_OK
            )
            
        except AIModel.DoesNotExist:
            return APIResponse.error(
                message=AI_ERRORS.get("model_not_found", "Model not found"),
                status_code=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return APIResponse.error(
                message=AI_ERRORS.get("image_generation_failed", "Image generation failed").format(error=str(e)),
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'], url_path='audio')
    def generate_audio(self, request):
        return APIResponse.error(
            message=AI_ERRORS.get("not_implemented", "Feature not implemented"),
            status_code=status.HTTP_501_NOT_IMPLEMENTED
        )
    
    @action(detail=False, methods=['get'], url_path='models')
    def available_models(self, request):
        capability = request.query_params.get('capability', 'chat')
        
        models = AIModel.objects.filter(
            provider__is_active=True,
            is_active=True
        ).select_related('provider')
        
        models = [m for m in models if capability in m.capabilities]
        
        result = []
        for model in models:
            state = ModelAccessState.calculate(model.provider, model, request.user)
            if state in [ModelAccessState.AVAILABLE_SHARED, ModelAccessState.AVAILABLE_PERSONAL]:
                result.append({
                    'id': model.id,
                    'name': model.display_name,
                    'provider': model.provider.display_name,
                    'capabilities': model.capabilities,
                    'is_free': model.pricing_input is None or model.pricing_input == 0,
                    'access_source': state.value,
                })
        
        return APIResponse.success(
            message=AI_SUCCESS.get("models_retrieved", "Models retrieved successfully"),
            data=result,
            status_code=status.HTTP_200_OK
        )
    
    @action(detail=False, methods=['get'], url_path='providers')
    def available_providers(self, request):
        providers = AIContentGenerationService.get_available_providers(request.user)
        return APIResponse.success(
            message=AI_SUCCESS.get("providers_list_retrieved", "Providers retrieved successfully"),
            data=providers,
            status_code=status.HTTP_200_OK
        )
