from django.core.cache import cache

from src.statistics.utils.cache import StatisticsCacheManager


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
        cache.delete(EmailCacheKeys.message(message_id))
        StatisticsCacheManager.invalidate_emails()
        StatisticsCacheManager.invalidate_dashboard()
    
    @staticmethod
    def invalidate_stats():
        cache.delete(EmailCacheKeys.stats())
        StatisticsCacheManager.invalidate_emails()
        StatisticsCacheManager.invalidate_dashboard()
    
    @staticmethod
    def invalidate_all(message_id=None):
        if message_id:
            EmailCacheManager.invalidate_message(message_id)
        EmailCacheManager.invalidate_stats()

