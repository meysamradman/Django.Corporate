from django.urls import path, include
from rest_framework.routers import DefaultRouter
from src.ai import views

router = DefaultRouter()
# API Keys مشترک (فقط سوپر ادمین)
router.register(r'admin/ai-providers', views.AIImageGenerationProviderViewSet, basename='ai-providers')

# تنظیمات AI شخصی (هر ادمین)
router.register(r'admin/ai-settings', views.AdminAISettingsViewSet, basename='ai-settings')

# استفاده از AI
router.register(r'admin/ai-generate', views.AIImageGenerationRequestViewSet, basename='ai-generate')
router.register(r'admin/ai-content', views.AIContentGenerationViewSet, basename='ai-content')
router.register(r'admin/ai-chat', views.AIChatViewSet, basename='ai-chat')
router.register(r'admin/ai-audio', views.AIAudioGenerationRequestViewSet, basename='ai-audio')

urlpatterns = [
    path('', include(router.urls)),
]

