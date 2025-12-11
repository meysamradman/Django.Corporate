from src.core.cache import CacheService
from src.analytics.utils.cache import AnalyticsCacheManager


class EmailCacheKeys:
    
    @staticmethod
    def message(message_id):
        return f"email:message:{message_id}"
    
    @staticmethod
    def stats():
        return "email:stats"
    
    @staticmethod
    def all_keys(message_id=None):
        keys = [EmailCacheKeys.stats()]
        if message_id:
            keys.append(EmailCacheKeys.message(message_id))
        return keys


class EmailCacheManager:
    
    @staticmethod
    def invalidate_message(message_id):
        CacheService.delete(EmailCacheKeys.message(message_id))
        AnalyticsCacheManager.invalidate_emails()
        AnalyticsCacheManager.invalidate_dashboard()
    
    @staticmethod
    def invalidate_stats():
        CacheService.delete(EmailCacheKeys.stats())
        AnalyticsCacheManager.invalidate_emails()
        AnalyticsCacheManager.invalidate_dashboard()
    
    @staticmethod
    def invalidate_all(message_id=None):
        if message_id:
            EmailCacheManager.invalidate_message(message_id)
        EmailCacheManager.invalidate_stats()

