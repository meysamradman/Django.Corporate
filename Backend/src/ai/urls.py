"""
AI App URLs - Dynamic System (2025)

Endpoints:
- /api/admin/ai-providers/          # Provider management (SuperAdmin only)
- /api/admin/ai-models/             # Models management
- /api/admin/ai-settings/           # Personal API settings
- /api/admin/ai-generate/           # Unified content generation
- /api/admin/ai-image-providers/    # Image Provider management (SuperAdmin)
- /api/admin/ai-images/             # Image generation (AiManager)
- /api/admin/ai-chat/               # Chat
- /api/admin/ai-audio/              # Audio generation
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from src.ai import views

router = DefaultRouter()

# Core System - Provider & Model Management
router.register(r'admin/ai-providers', views.AIProviderViewSet, basename='ai-providers')
router.register(r'admin/ai-models', views.AIModelViewSet, basename='ai-models')
router.register(r'admin/ai-settings', views.AdminProviderSettingsViewSet, basename='ai-settings')

# AI Generation - Unified & Specialized
router.register(r'admin/ai-generate', views.AIGenerationViewSet, basename='ai-generate')

# Image Generation - Provider Management + Generation
router.register(r'admin/ai-image-providers', views.AIImageProviderViewSet, basename='ai-image-providers')
router.register(r'admin/ai-images', views.AIImageGenerationViewSet, basename='ai-images')

# Chat & Audio
router.register(r'admin/ai-chat', views.AIChatViewSet, basename='ai-chat')
router.register(r'admin/ai-audio', views.AIAudioGenerationRequestViewSet, basename='ai-audio')

urlpatterns = [
    path('', include(router.urls)),
]

