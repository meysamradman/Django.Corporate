from src.core.cache import CacheService

class ChatbotCacheKeys:
    
    @staticmethod
    def faqs_active():
        return "chatbot:faqs:active"
    
    @staticmethod
    def settings():
        return "chatbot:settings"
    
    @staticmethod
    def all_keys():
        return [
            ChatbotCacheKeys.faqs_active(),
            ChatbotCacheKeys.settings(),
        ]

class ChatbotCacheManager:
    
    @staticmethod
    def invalidate_faqs():
        return CacheService.delete(ChatbotCacheKeys.faqs_active())
    
    @staticmethod
    def invalidate_settings():
        return CacheService.delete(ChatbotCacheKeys.settings())
    
    @staticmethod
    def invalidate_all():
        return CacheService.delete_many(ChatbotCacheKeys.all_keys())

