from django.core.cache import cache


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
        cache.delete(ChatbotCacheKeys.faqs_active())
    
    @staticmethod
    def invalidate_settings():
        cache.delete(ChatbotCacheKeys.settings())
    
    @staticmethod
    def invalidate_all():
        cache.delete_many(ChatbotCacheKeys.all_keys())

