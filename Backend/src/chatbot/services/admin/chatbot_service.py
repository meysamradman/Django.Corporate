from src.core.cache import CacheService
from src.chatbot.models.faq import FAQ
from src.chatbot.models.settings import ChatbotSettings
from src.chatbot.services.public.chatbot_service import RuleBasedChatService
from src.chatbot.utils.cache_admin import ChatbotAdminCacheKeys, ChatbotAdminCacheManager
from src.chatbot.utils.cache_ttl import ChatbotCacheTTL

class ChatbotAdminService:
    @staticmethod
    def get_faq_list():
        cache_key = ChatbotAdminCacheKeys.faq_list()
        cached_data = CacheService.get(cache_key)
        if cached_data is not None:
            return cached_data, True
            
        queryset = FAQ.objects.all().order_by('order', '-created_at')
        return queryset, False

    @staticmethod
    def cache_faq_list(data):
        cache_key = ChatbotAdminCacheKeys.faq_list()
        CacheService.set(cache_key, data, ChatbotCacheTTL.ADMIN_FAQ_LIST)

    @staticmethod
    def invalidate_chatbot_cache():
        RuleBasedChatService.clear_cache()
        ChatbotAdminCacheManager.invalidate_faqs()

    @staticmethod
    def get_settings():
        cache_key = ChatbotAdminCacheKeys.settings()
        cached_data = CacheService.get(cache_key)
        
        if cached_data is not None:
            return cached_data, True

        settings = ChatbotSettings.objects.first()
        if not settings:
            settings = ChatbotSettings.objects.create()
            
        return settings, False

    @staticmethod
    def cache_settings(data):
        cache_key = ChatbotAdminCacheKeys.settings()
        CacheService.set(cache_key, data, ChatbotCacheTTL.ADMIN_SETTINGS)

    @staticmethod
    def update_settings(instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        RuleBasedChatService.clear_cache()
        ChatbotAdminCacheManager.invalidate_settings()
        return instance
