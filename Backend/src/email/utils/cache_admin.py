from src.analytics.utils.cache import AnalyticsCacheManager
from src.core.cache import CacheService

from .cache_shared import compose_email_key

class EmailCacheAdminKeys:
    @staticmethod
    def message(message_id: int):
        return compose_email_key("admin", "email", "message", str(message_id))

    @staticmethod
    def stats():
        return compose_email_key("admin", "email", "stats")

    @staticmethod
    def legacy_message(message_id: int):
        return compose_email_key("email", "message", str(message_id))

    @staticmethod
    def legacy_stats():
        return compose_email_key("email", "stats")

class EmailCacheAdminManager:
    @staticmethod
    def invalidate_message(message_id: int):
        CacheService.delete(EmailCacheAdminKeys.message(message_id))
        CacheService.delete(EmailCacheAdminKeys.legacy_message(message_id))
        AnalyticsCacheManager.invalidate_emails()
        AnalyticsCacheManager.invalidate_dashboard()

    @staticmethod
    def invalidate_stats():
        CacheService.delete(EmailCacheAdminKeys.stats())
        CacheService.delete(EmailCacheAdminKeys.legacy_stats())
        AnalyticsCacheManager.invalidate_emails()
        AnalyticsCacheManager.invalidate_dashboard()

    @staticmethod
    def invalidate_all(message_id: int | None = None):
        if message_id is not None:
            EmailCacheAdminManager.invalidate_message(message_id)
        EmailCacheAdminManager.invalidate_stats()
