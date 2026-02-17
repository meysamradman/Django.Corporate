from src.core.cache import CacheService


class ChatbotPublicCacheKeys:
    @staticmethod
    def faqs_active():
        return "public:chatbot:faqs:active"

    @staticmethod
    def settings_id():
        return "public:chatbot:settings:id"

    @staticmethod
    def faqs_legacy():
        return "chatbot:faqs:active"

    @staticmethod
    def settings_legacy():
        return "chatbot:settings"


class ChatbotPublicCacheManager:
    @staticmethod
    def invalidate_faqs():
        CacheService.delete(ChatbotPublicCacheKeys.faqs_active())
        CacheService.delete(ChatbotPublicCacheKeys.faqs_legacy())

    @staticmethod
    def invalidate_settings():
        CacheService.delete(ChatbotPublicCacheKeys.settings_id())
        CacheService.delete(ChatbotPublicCacheKeys.settings_legacy())
