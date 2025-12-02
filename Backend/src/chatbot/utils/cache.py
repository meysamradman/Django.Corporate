"""
Cache key utilities and cache management for chatbot app
Standardized cache keys to avoid conflicts
"""
from django.core.cache import cache


class ChatbotCacheKeys:
    """Standardized cache keys for chatbot app"""
    
    @staticmethod
    def faqs_active():
        """Cache key for active FAQs"""
        return "chatbot:faqs:active"
    
    @staticmethod
    def settings():
        """Cache key for chatbot settings"""
        return "chatbot:settings"
    
    @staticmethod
    def all_keys():
        """Return all cache keys for chatbot"""
        return [
            ChatbotCacheKeys.faqs_active(),
            ChatbotCacheKeys.settings(),
        ]


class ChatbotCacheManager:
    """Cache management utilities for chatbot operations"""
    
    @staticmethod
    def invalidate_faqs():
        """Invalidate FAQs cache"""
        cache.delete(ChatbotCacheKeys.faqs_active())
    
    @staticmethod
    def invalidate_settings():
        """Invalidate chatbot settings cache"""
        cache.delete(ChatbotCacheKeys.settings())
    
    @staticmethod
    def invalidate_all():
        """Invalidate all chatbot-related cache"""
        cache.delete_many(ChatbotCacheKeys.all_keys())

