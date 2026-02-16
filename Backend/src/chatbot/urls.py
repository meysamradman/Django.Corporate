from django.urls import path, include
from rest_framework.routers import DefaultRouter
from src.chatbot.views import AdminFAQViewSet, AdminChatbotSettingsViewSet, PublicChatbotViewSet

router = DefaultRouter()
router.register(r'admin/chatbot/faq', AdminFAQViewSet, basename='chatbot-faq')
router.register(r'admin/chatbot/settings', AdminChatbotSettingsViewSet, basename='chatbot-settings')
router.register(r'chatbot', PublicChatbotViewSet, basename='public-chatbot')

urlpatterns = [
    path('', include(router.urls)),
]
