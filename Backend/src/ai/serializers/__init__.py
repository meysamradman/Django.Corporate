"""
AI Serializers - Dynamic System (2025)
"""
# ✅ Core Dynamic System Serializers
from .ai_provider_serializer import (
    AIProviderListSerializer,
    AIProviderDetailSerializer,
    AIProviderCreateUpdateSerializer,
    AIModelListSerializer,
    AIModelDetailSerializer,
    AIModelCreateUpdateSerializer,
    AdminProviderSettingsSerializer,
    AdminProviderSettingsUpdateSerializer,
)

# ✅ AI Generation Serializers
from .content_generation_serializer import (
    AIContentGenerationRequestSerializer,
    AIContentGenerationResponseSerializer
)
from .image_generation_serializer import (
    AIProviderSerializer,
    AIProviderListSerializer as AIProviderListImageSerializer,
    AIImageGenerationRequestSerializer,
)
from .chat_serializer import (
    AIChatRequestSerializer,
    AIChatResponseSerializer,
    AIChatMessageSerializer,
)
from .audio_generation_serializer import AIAudioGenerationRequestSerializer

__all__ = [
    # Core dynamic system
    'AIProviderListSerializer',
    'AIProviderDetailSerializer',
    'AIProviderCreateUpdateSerializer',
    'AIModelListSerializer',
    'AIModelDetailSerializer',
    'AIModelCreateUpdateSerializer',
    'AdminProviderSettingsSerializer',
    'AdminProviderSettingsUpdateSerializer',
    # Generation features
    'AIContentGenerationRequestSerializer',
    'AIContentGenerationResponseSerializer',
    'AIProviderSerializer',
    'AIProviderListImageSerializer',
    'AIImageGenerationRequestSerializer',
    'AIChatRequestSerializer',
    'AIChatResponseSerializer',
    'AIChatMessageSerializer',
    'AIAudioGenerationRequestSerializer',
]

