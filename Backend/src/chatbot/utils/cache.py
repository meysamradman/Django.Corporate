from src.core.cache import CacheService

class ChatbotCacheKeys:
    
    @staticmethod
    def public_faqs_active():
        return "chatbot:public:faqs:active"
    
    @staticmethod
    def public_settings_id():
        return "chatbot:public:settings:id"

    @staticmethod
    def admin_faq_list():
        return "chatbot:admin:faq:list"

    @staticmethod
    def admin_settings():
        return "chatbot:admin:settings"

    # Backward-compatible legacy keys (used in older code)
    @staticmethod
    def legacy_faqs_active():
        return "chatbot:faqs:active"

    @staticmethod
    def legacy_settings():
        return "chatbot:settings"
    
    @staticmethod
    def all_keys():
        return [
            ChatbotCacheKeys.public_faqs_active(),
            ChatbotCacheKeys.public_settings_id(),
            ChatbotCacheKeys.admin_faq_list(),
            ChatbotCacheKeys.admin_settings(),
            ChatbotCacheKeys.legacy_faqs_active(),
            ChatbotCacheKeys.legacy_settings(),
        ]

class ChatbotCacheManager:
    
    @staticmethod
    def invalidate_faqs():
        CacheService.delete(ChatbotCacheKeys.public_faqs_active())
        CacheService.delete(ChatbotCacheKeys.admin_faq_list())
        return CacheService.delete(ChatbotCacheKeys.legacy_faqs_active())
    
    @staticmethod
    def invalidate_settings():
        CacheService.delete(ChatbotCacheKeys.public_settings_id())
        CacheService.delete(ChatbotCacheKeys.admin_settings())
        return CacheService.delete(ChatbotCacheKeys.legacy_settings())
    
    @staticmethod
    def invalidate_all():
        return CacheService.delete_many(ChatbotCacheKeys.all_keys())

