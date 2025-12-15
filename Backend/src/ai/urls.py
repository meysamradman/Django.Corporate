from django.urls import path, include
from rest_framework.routers import DefaultRouter
from src.ai import views

router = DefaultRouter()

# Provider Management
router.register(r'admin/ai-providers', views.AIProviderViewSet, basename='ai-providers')
router.register(r'admin/ai-models', views.AIModelManagementViewSet, basename='ai-models')
router.register(r'admin/ai-settings', views.AdminProviderSettingsViewSet, basename='ai-settings')

# Generation APIs
router.register(r'admin/ai-chat', views.AIChatViewSet, basename='ai-chat')
router.register(r'admin/ai-content', views.AIContentGenerationViewSet, basename='ai-content')
router.register(r'admin/ai-images', views.AIImageGenerationViewSet, basename='ai-images')
router.register(r'admin/ai-audio', views.AIAudioGenerationRequestViewSet, basename='ai-audio')

urlpatterns = [
    path('', include(router.urls)),
]
