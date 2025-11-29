"""
AI Views - Dynamic System ViewSets (2025)
"""
# ✅ Core Dynamic System ViewSets
from .ai_provider_views import (
    AIProviderViewSet,
    AIModelViewSet,
    AdminProviderSettingsViewSet,
)

# ✅ Unified AI Generation ViewSet
from .generation_views import AIGenerationViewSet

# ✅ Specialized Generation ViewSets
from .image_generation_views import (
    AIImageProviderViewSet,
    AIImageGenerationViewSet,
)
from .content_generation_views import AIContentGenerationViewSet
from .chat_views import AIChatViewSet
from .audio_generation_views import AIAudioGenerationRequestViewSet

__all__ = [
    # Core dynamic system
    'AIProviderViewSet',
    'AIModelViewSet',
    'AdminProviderSettingsViewSet',
    # Unified generation
    'AIGenerationViewSet',
    # Specialized generation
    'AIImageProviderViewSet',
    'AIImageGenerationViewSet',
    'AIContentGenerationViewSet',
    'AIChatViewSet',
    'AIAudioGenerationRequestViewSet',
]

