"""
Unified AI Generation Views - ViewSet واحد برای تمام عملیات AI

این ViewSet جایگزین ViewSetهای جداگانه می‌شود و از UnifiedAIService استفاده می‌کند.
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
import base64
from io import BytesIO

from src.core.responses.response import APIResponse
from src.ai.services.unified_service import UnifiedAIService
from src.ai.messages.messages import AI_SUCCESS, AI_ERRORS
from src.user.access_control import PermissionValidator
from src.user.auth.admin_session_auth import CSRFExemptSessionAuthentication
from src.media.services.media_services import MediaAdminService


class UnifiedAIGenerationViewSet(viewsets.ViewSet):
    """
    ViewSet واحد برای تمام عملیات AI
    
    Endpoints:
    - POST /api/admin/ai/image/generate - تولید تصویر
    - GET  /api/admin/ai/image/models - لیست مدل‌های image
    - POST /api/admin/ai/content/generate - تولید محتوا
    - GET  /api/admin/ai/content/models - لیست مدل‌های content
    - POST /api/admin/ai/chat/send - چت
    - GET  /api/admin/ai/chat/models - لیست مدل‌های chat
    - POST /api/admin/ai/audio/generate - تولید صدا
    - GET  /api/admin/ai/audio/models - لیست مدل‌های audio
    """
    
    authentication_classes = [CSRFExemptSessionAuthentication]
    permission_classes = [IsAuthenticated]
    
    def _check_permission(self, user, capability: str) -> bool:
        """
        بررسی دسترسی کاربر
        
        Args:
            user: کاربر
            capability: نوع قابلیت
            
        Returns:
            True اگر دسترسی داشته باشد
        """
        # بررسی permission کلی AI
        has_manage = PermissionValidator.has_permission(user, 'ai.manage')
        has_capability = PermissionValidator.has_permission(user, f'ai.{capability}.manage')
        
        return has_manage or has_capability
    
    # ==================== Image Generation ====================
    
    @action(detail=False, methods=['post'], url_path='image/generate')
    def generate_image(self, request):
        """
        تولید تصویر
        
        Body:
        {
            "prompt": "a beautiful sunset",
            "model_id": 123,  # اختیاری
            "size": "1024x1024",  # اختیاری
            "quality": "hd",  # اختیاری
            "save_to_media": false  # اختیاری
        }
        """
        if not self._check_permission(request.user, 'image'):
            return APIResponse.error(
                message=AI_ERRORS.get("image_not_authorized", "Access denied"),
                status_code=status.HTTP_403_FORBIDDEN
            )
        
        prompt = request.data.get('prompt')
        if not prompt:
            return APIResponse.error(
                message=AI_ERRORS.get("prompt_required", "Prompt is required"),
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            model_id = request.data.get('model_id')
            size = request.data.get('size', '1024x1024')
            quality = request.data.get('quality', 'standard')
            save_to_media = request.data.get('save_to_media', False)
            
            # تولید تصویر
            image_bytes = UnifiedAIService.generate_image(
                prompt=prompt,
                admin=request.user,
                model_id=model_id,
                size=size,
                quality=quality
            )
            
            # تبدیل به base64
            image_bytes.seek(0)
            image_base64 = base64.b64encode(image_bytes.read()).decode('utf-8')
            
            result = {
                'image': f'data:image/png;base64,{image_base64}',
                'prompt': prompt,
            }
            
            # ذخیره در media (اگر درخواست شده باشد)
            if save_to_media:
                try:
                    media = MediaAdminService.upload_image_from_bytes(
                        image_bytes=image_bytes,
                        user=request.user,
                        title=f"AI Generated: {prompt[:50]}"
                    )
                    result['media_id'] = media.id
                    result['media_url'] = media.file.url if media.file else None
                except Exception as e:
                    result['media_error'] = str(e)
            
            return APIResponse.success(
                message=AI_SUCCESS.get("image_generated", "Image generated successfully"),
                data=result
            )
            
        except ValueError as e:
            return APIResponse.error(
                message=str(e),
                status_code=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return APIResponse.error(
                message=AI_ERRORS.get("image_generation_failed", "Image generation failed").format(error=str(e)),
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'], url_path='image/models')
    def get_image_models(self, request):
        """
        دریافت لیست مدل‌های image
        """
        if not self._check_permission(request.user, 'image'):
            return APIResponse.error(
                message=AI_ERRORS.get("image_not_authorized", "Access denied"),
                status_code=status.HTTP_403_FORBIDDEN
            )
        
        try:
            models = UnifiedAIService.get_available_models('image', request.user)
            return APIResponse.success(
                message=AI_SUCCESS.get("models_list_retrieved", "Models retrieved successfully"),
                data=models
            )
        except Exception as e:
            return APIResponse.error(
                message=AI_ERRORS.get("models_list_error", "Error retrieving models").format(error=str(e)),
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    # ==================== Content Generation ====================
    
    @action(detail=False, methods=['post'], url_path='content/generate')
    def generate_content(self, request):
        """
        تولید محتوا
        
        Body:
        {
            "topic": "AI in healthcare",
            "model_id": 123,  # اختیاری
            "word_count": 1000,  # اختیاری
            "tone": "professional",  # اختیاری
            "keywords": ["AI", "healthcare"]  # اختیاری
        }
        """
        if not self._check_permission(request.user, 'content'):
            return APIResponse.error(
                message=AI_ERRORS.get("content_not_authorized", "Access denied"),
                status_code=status.HTTP_403_FORBIDDEN
            )
        
        topic = request.data.get('topic')
        if not topic:
            return APIResponse.error(
                message=AI_ERRORS.get("topic_required", "Topic is required"),
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            model_id = request.data.get('model_id')
            word_count = request.data.get('word_count', 500)
            tone = request.data.get('tone', 'professional')
            keywords = request.data.get('keywords', [])
            
            # تولید محتوا
            content = UnifiedAIService.generate_content(
                topic=topic,
                admin=request.user,
                model_id=model_id,
                word_count=word_count,
                tone=tone,
                keywords=keywords
            )
            
            return APIResponse.success(
                message=AI_SUCCESS.get("content_generated", "Content generated successfully"),
                data=content
            )
            
        except ValueError as e:
            return APIResponse.error(
                message=str(e),
                status_code=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return APIResponse.error(
                message=AI_ERRORS.get("content_generation_failed", "Content generation failed").format(error=str(e)),
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'], url_path='content/models')
    def get_content_models(self, request):
        """
        دریافت لیست مدل‌های content
        """
        if not self._check_permission(request.user, 'content'):
            return APIResponse.error(
                message=AI_ERRORS.get("content_not_authorized", "Access denied"),
                status_code=status.HTTP_403_FORBIDDEN
            )
        
        try:
            models = UnifiedAIService.get_available_models('content', request.user)
            return APIResponse.success(
                message=AI_SUCCESS.get("models_list_retrieved", "Models retrieved successfully"),
                data=models
            )
        except Exception as e:
            return APIResponse.error(
                message=AI_ERRORS.get("models_list_error", "Error retrieving models").format(error=str(e)),
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    # ==================== Chat ====================
    
    @action(detail=False, methods=['post'], url_path='chat/send')
    def send_chat(self, request):
        """
        ارسال پیام چت
        
        Body:
        {
            "message": "What is AI?",
            "model_id": 123,  # اختیاری
            "conversation_history": [],  # اختیاری
            "system_message": "...",  # اختیاری
            "temperature": 0.7,  # اختیاری
            "max_tokens": 2048  # اختیاری
        }
        """
        if not self._check_permission(request.user, 'chat'):
            return APIResponse.error(
                message=AI_ERRORS.get("chat_not_authorized", "Access denied"),
                status_code=status.HTTP_403_FORBIDDEN
            )
        
        message = request.data.get('message')
        if not message:
            return APIResponse.error(
                message=AI_ERRORS.get("validation_error", "Message is required"),
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            model_id = request.data.get('model_id')
            conversation_history = request.data.get('conversation_history', [])
            system_message = request.data.get('system_message')
            temperature = request.data.get('temperature', 0.7)
            max_tokens = request.data.get('max_tokens', 2048)
            
            # ارسال پیام
            reply = UnifiedAIService.chat(
                message=message,
                admin=request.user,
                model_id=model_id,
                conversation_history=conversation_history,
                system_message=system_message,
                temperature=temperature,
                max_tokens=max_tokens
            )
            
            return APIResponse.success(
                message=AI_SUCCESS.get("message_sent", "Message sent successfully"),
                data={'reply': reply}
            )
            
        except ValueError as e:
            return APIResponse.error(
                message=str(e),
                status_code=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return APIResponse.error(
                message=AI_ERRORS.get("chat_failed", "Chat failed").format(error=str(e)),
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'], url_path='chat/models')
    def get_chat_models(self, request):
        """
        دریافت لیست مدل‌های chat
        """
        if not self._check_permission(request.user, 'chat'):
            return APIResponse.error(
                message=AI_ERRORS.get("chat_not_authorized", "Access denied"),
                status_code=status.HTTP_403_FORBIDDEN
            )
        
        try:
            models = UnifiedAIService.get_available_models('chat', request.user)
            return APIResponse.success(
                message=AI_SUCCESS.get("models_list_retrieved", "Models retrieved successfully"),
                data=models
            )
        except Exception as e:
            return APIResponse.error(
                message=AI_ERRORS.get("models_list_error", "Error retrieving models").format(error=str(e)),
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    # ==================== Audio Generation ====================
    
    @action(detail=False, methods=['post'], url_path='audio/generate')
    def generate_audio(self, request):
        """
        تولید صدا (Text-to-Speech)
        
        Body:
        {
            "text": "Hello world",
            "model_id": 123,  # اختیاری
            "voice": "alloy",  # اختیاری
            "speed": 1.0  # اختیاری
        }
        """
        if not self._check_permission(request.user, 'audio'):
            return APIResponse.error(
                message=AI_ERRORS.get("audio_not_authorized", "Access denied"),
                status_code=status.HTTP_403_FORBIDDEN
            )
        
        text = request.data.get('text')
        if not text:
            return APIResponse.error(
                message=AI_ERRORS.get("text_empty", "Text is required"),
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            model_id = request.data.get('model_id')
            voice = request.data.get('voice', 'alloy')
            speed = request.data.get('speed', 1.0)
            
            # تولید صدا
            audio_bytes = UnifiedAIService.text_to_speech(
                text=text,
                admin=request.user,
                model_id=model_id,
                voice=voice,
                speed=speed
            )
            
            # تبدیل به base64
            audio_bytes.seek(0)
            audio_base64 = base64.b64encode(audio_bytes.read()).decode('utf-8')
            
            return APIResponse.success(
                message=AI_SUCCESS.get("audio_generated", "Audio generated successfully"),
                data={
                    'audio': f'data:audio/mpeg;base64,{audio_base64}',
                    'text': text,
                }
            )
            
        except ValueError as e:
            return APIResponse.error(
                message=str(e),
                status_code=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return APIResponse.error(
                message=AI_ERRORS.get("audio_generation_failed", "Audio generation failed").format(error=str(e)),
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'], url_path='audio/models')
    def get_audio_models(self, request):
        """
        دریافت لیست مدل‌های audio
        """
        if not self._check_permission(request.user, 'audio'):
            return APIResponse.error(
                message=AI_ERRORS.get("audio_not_authorized", "Access denied"),
                status_code=status.HTTP_403_FORBIDDEN
            )
        
        try:
            models = UnifiedAIService.get_available_models('text_to_speech', request.user)
            return APIResponse.success(
                message=AI_SUCCESS.get("models_list_retrieved", "Models retrieved successfully"),
                data=models
            )
        except Exception as e:
            return APIResponse.error(
                message=AI_ERRORS.get("models_list_error", "Error retrieving models").format(error=str(e)),
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

