from django.core.cache import cache
from src.chatbot.models.faq import FAQ
from src.chatbot.models.settings import ChatbotSettings
from src.chatbot.services.public.chatbot_service import RuleBasedChatService
from src.chatbot.utils.cache import ChatbotCacheKeys, ChatbotCacheManager

class ChatbotAdminService:
    @staticmethod
    def get_faq_list():
        cache_key = ChatbotCacheKeys.admin_faq_list()
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return cached_data, True
            
        queryset = FAQ.objects.all().order_by('order', '-created_at')
        return queryset, False

    @staticmethod
    def cache_faq_list(data):
        cache_key = ChatbotCacheKeys.admin_faq_list()
        cache.set(cache_key, data, 300)

    @staticmethod
    def invalidate_chatbot_cache():
        RuleBasedChatService.clear_cache()
        ChatbotCacheManager.invalidate_faqs()

    @staticmethod
    def get_settings():
        cache_key = ChatbotCacheKeys.admin_settings()
        cached_data = cache.get(cache_key)
        
        if cached_data is not None:
            return cached_data, True

        settings = ChatbotSettings.objects.first()
        if not settings:
            settings = ChatbotSettings.objects.create()
            
        return settings, False

    @staticmethod
    def cache_settings(data):
        cache_key = ChatbotCacheKeys.admin_settings()
        cache.set(cache_key, data, 300)

    @staticmethod
    def update_settings(instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        RuleBasedChatService.clear_cache()
        ChatbotCacheManager.invalidate_settings()
        return instance
