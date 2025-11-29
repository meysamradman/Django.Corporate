"""
✅ AI Generation ViewSet - Unified Content Generation (2025)

Single ViewSet for all AI capabilities:
- Chat (text generation)
- Image (DALL-E, Imagen, etc.)
- Audio (TTS, music)
- Speech-to-Text
- Code generation
- Embeddings

Automatically routes to correct provider based on model capability.
"""
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


class AIGenerationViewSet(viewsets.ViewSet):
    """
    ✅ Unified AI Generation ViewSet for Admin Panel
    
    Supports all capabilities dynamically:
    - POST /api/ai/admin/generate/text/      # Text/Chat generation
    - POST /api/ai/admin/generate/image/     # Image generation
    - POST /api/ai/admin/generate/audio/     # Audio/TTS generation
    - GET  /api/ai/admin/generate/models/    # Available models by capability
    """
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['post'], url_path='text')
    def generate_text(self, request):
        """
        Generate text/chat content
        
        Request:
        {
            "model_id": 1,
            "prompt": "Write about...",
            "max_tokens": 500,
            "temperature": 0.7
        }
        """
        serializer = AIContentGenerationRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        data = serializer.validated_data
        model_id = data.get('model_id')
        
        try:
            # Get model
            model = AIModel.objects.select_related('provider').get(id=model_id)
            
            # Check access
            state = ModelAccessState.calculate(model.provider, model, request.user)
            if state not in [ModelAccessState.AVAILABLE_SHARED, ModelAccessState.AVAILABLE_PERSONAL]:
                return Response(
                    {"error": "شما به این مدل دسترسی ندارید"},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Check capability
            if 'chat' not in model.capabilities and 'text' not in model.capabilities:
                return Response(
                    {"error": "این مدل قابلیت تولید متن ندارد"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Generate content
            result = AIContentGenerationService.generate_content(
                topic=data.get('prompt'),
                provider_name=model.provider.slug,
                admin=request.user,
                word_count=data.get('max_tokens', 500),
                tone=data.get('tone', 'professional')
            )
            
            # Track usage
            model.increment_usage()
            
            return Response(result, status=status.HTTP_200_OK)
            
        except AIModel.DoesNotExist:
            return Response(
                {"error": "مدل یافت نشد"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'], url_path='image')
    def generate_image(self, request):
        """
        Generate image
        
        Request:
        {
            "model_id": 5,
            "prompt": "A beautiful landscape...",
            "size": "1024x1024",
            "quality": "hd",
            "save_to_media": true
        }
        """
        from src.ai.serializers.image_generation_serializer import AIImageGenerationRequestSerializer
        from src.ai.services.image_generation_service import AIImageGenerationService
        
        serializer = AIImageGenerationRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        data = serializer.validated_data
        model_id = data.get('model_id')
        
        try:
            # Get model
            model = AIModel.objects.select_related('provider').get(id=model_id)
            
            # Check access
            state = ModelAccessState.calculate(model.provider, model, request.user)
            if state not in [ModelAccessState.AVAILABLE_SHARED, ModelAccessState.AVAILABLE_PERSONAL]:
                return Response(
                    {"error": "شما به این مدل دسترسی ندارید"},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Check capability
            if 'image' not in model.capabilities:
                return Response(
                    {"error": "این مدل قابلیت تولید تصویر ندارد"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            import time
            start_time = time.time()
            
            # Generate image
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
            
            # Track usage
            model.increment_usage()
            
            return Response(result, status=status.HTTP_200_OK)
            
        except AIModel.DoesNotExist:
            return Response(
                {"error": "مدل یافت نشد"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"success": False, "error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'], url_path='audio')
    def generate_audio(self, request):
        """
        Generate audio/TTS
        
        Request:
        {
            "model_id": 8,
            "text": "Hello world",
            "voice": "alloy"
        }
        """
        # TODO: Implement audio generation
        return Response(
            {"message": "Audio generation coming soon"},
            status=status.HTTP_501_NOT_IMPLEMENTED
        )
    
    @action(detail=False, methods=['get'], url_path='models')
    def available_models(self, request):
        """
        Get available models filtered by capability
        
        Query params:
        - capability: chat, image, audio, code, etc.
        """
        capability = request.query_params.get('capability', 'chat')
        
        # Get models with this capability
        models = AIModel.objects.filter(
            provider__is_active=True,
            is_active=True
        ).select_related('provider')
        
        # Filter by capability
        models = [m for m in models if capability in m.capabilities]
        
        # Check access for each model
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
        
        return Response(result, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['get'], url_path='providers')
    def available_providers(self, request):
        """Get available providers for current admin"""
        providers = AIContentGenerationService.get_available_providers(request.user)
        return Response(providers, status=status.HTTP_200_OK)
