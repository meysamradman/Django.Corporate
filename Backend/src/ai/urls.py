from django.urls import path, include
from rest_framework.routers import DefaultRouter
from src.ai import views

router = DefaultRouter()
router.register(r'admin/ai-providers', views.AIImageGenerationProviderViewSet, basename='ai-providers')
router.register(r'admin/ai-generate', views.AIImageGenerationRequestViewSet, basename='ai-generate')
router.register(r'admin/ai-content', views.AIContentGenerationViewSet, basename='ai-content')
router.register(r'admin/ai-chat', views.AIChatViewSet, basename='ai-chat')

urlpatterns = [
    path('', include(router.urls)),
]

