from src.core.cache import CacheService

from .cache_public import ChatbotPublicCacheManager

class ChatbotAdminCacheKeys:
    @staticmethod
    def faq_list():
        return "admin:chatbot:faq:list"

    @staticmethod
    def settings():
        return "admin:chatbot:settings"

class ChatbotAdminCacheManager:
    @staticmethod
    def invalidate_faqs():
        CacheService.delete(ChatbotAdminCacheKeys.faq_list())
        ChatbotPublicCacheManager.invalidate_faqs()

    @staticmethod
    def invalidate_settings():
        CacheService.delete(ChatbotAdminCacheKeys.settings())
        ChatbotPublicCacheManager.invalidate_settings()

    @staticmethod
    def invalidate_all():
        ChatbotAdminCacheManager.invalidate_faqs()
        ChatbotAdminCacheManager.invalidate_settings()
