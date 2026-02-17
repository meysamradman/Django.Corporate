from src.core.cache import CacheService
from src.analytics.utils.cache_shared import compose_analytics_key

class AnalyticsAdminCacheKeys:
    @staticmethod
    def dashboard():
        return compose_analytics_key("stats:dashboard")

    @staticmethod
    def users():
        return compose_analytics_key("stats:users")

    @staticmethod
    def admins():
        return compose_analytics_key("stats:admins")

    @staticmethod
    def content():
        return compose_analytics_key("stats:content")

    @staticmethod
    def tickets():
        return compose_analytics_key("stats:tickets")

    @staticmethod
    def emails():
        return compose_analytics_key("stats:emails")

    @staticmethod
    def system():
        return compose_analytics_key("stats:system")

    @staticmethod
    def forms():
        return compose_analytics_key("stats:forms")

    @staticmethod
    def media():
        return compose_analytics_key("stats:media")

    @staticmethod
    def ai():
        return compose_analytics_key("stats:ai")

    @staticmethod
    def activity_log():
        return compose_analytics_key("stats:activity_log")

    @staticmethod
    def traffic_dashboard(site_id: str = "default"):
        return compose_analytics_key("traffic:dashboard", site_id)

    @staticmethod
    def monthly_stats():
        return compose_analytics_key("traffic:monthly")

    @staticmethod
    def content_trend():
        return compose_analytics_key("content:trend")

    @staticmethod
    def traffic_dashboard_pattern():
        return f"{compose_analytics_key('traffic:dashboard')}:*"

    @staticmethod
    def time_based_stats(stat_type, days):
        return compose_analytics_key(f"stats:{stat_type}:time", days)

    @staticmethod
    def online_users(site_id: str = "default"):
        return compose_analytics_key("realtime:online_users", site_id)

    @staticmethod
    def online_users_pattern():
        return f"{compose_analytics_key('realtime:online_users')}:*"

    @staticmethod
    def all_keys():
        return [
            AnalyticsAdminCacheKeys.dashboard(),
            AnalyticsAdminCacheKeys.users(),
            AnalyticsAdminCacheKeys.admins(),
            AnalyticsAdminCacheKeys.content(),
            AnalyticsAdminCacheKeys.tickets(),
            AnalyticsAdminCacheKeys.emails(),
            AnalyticsAdminCacheKeys.system(),
            AnalyticsAdminCacheKeys.forms(),
            AnalyticsAdminCacheKeys.media(),
            AnalyticsAdminCacheKeys.ai(),
            AnalyticsAdminCacheKeys.activity_log(),
            AnalyticsAdminCacheKeys.monthly_stats(),
            AnalyticsAdminCacheKeys.content_trend(),
            AnalyticsAdminCacheKeys.online_users(),
        ]

class AnalyticsAdminCacheManager:
    @staticmethod
    def invalidate_dashboard():
        return CacheService.delete(AnalyticsAdminCacheKeys.dashboard())

    @staticmethod
    def invalidate_users():
        return CacheService.delete(AnalyticsAdminCacheKeys.users())

    @staticmethod
    def invalidate_admins():
        return CacheService.delete(AnalyticsAdminCacheKeys.admins())

    @staticmethod
    def invalidate_content():
        return CacheService.delete(AnalyticsAdminCacheKeys.content())

    @staticmethod
    def invalidate_tickets():
        return CacheService.delete(AnalyticsAdminCacheKeys.tickets())

    @staticmethod
    def invalidate_emails():
        return CacheService.delete(AnalyticsAdminCacheKeys.emails())

    @staticmethod
    def invalidate_system():
        return CacheService.delete(AnalyticsAdminCacheKeys.system())

    @staticmethod
    def invalidate_forms():
        return CacheService.delete(AnalyticsAdminCacheKeys.forms())

    @staticmethod
    def invalidate_media():
        return CacheService.delete(AnalyticsAdminCacheKeys.media())

    @staticmethod
    def invalidate_ai():
        return CacheService.delete(AnalyticsAdminCacheKeys.ai())

    @staticmethod
    def invalidate_activity_log():
        return CacheService.delete(AnalyticsAdminCacheKeys.activity_log())

    @staticmethod
    def invalidate_traffic_dashboard(site_id: str = "default"):
        return CacheService.delete(AnalyticsAdminCacheKeys.traffic_dashboard(site_id))

    @staticmethod
    def invalidate_all_traffic_dashboards():
        return CacheService.delete_pattern(AnalyticsAdminCacheKeys.traffic_dashboard_pattern())

    @staticmethod
    def invalidate_monthly_stats():
        return CacheService.delete(AnalyticsAdminCacheKeys.monthly_stats())

    @staticmethod
    def invalidate_content_trend():
        return CacheService.delete(AnalyticsAdminCacheKeys.content_trend())

    @staticmethod
    def invalidate_time_based(stat_type, days):
        return CacheService.delete(AnalyticsAdminCacheKeys.time_based_stats(stat_type, days))

    @staticmethod
    def invalidate_online_users(site_id: str = "default"):
        return CacheService.delete(AnalyticsAdminCacheKeys.online_users(site_id))

    @staticmethod
    def invalidate_all_online_users():
        return CacheService.delete_pattern(AnalyticsAdminCacheKeys.online_users_pattern())

    @staticmethod
    def invalidate_all():
        deleted = CacheService.delete_many(AnalyticsAdminCacheKeys.all_keys())
        deleted += CacheService.delete_pattern(AnalyticsAdminCacheKeys.traffic_dashboard_pattern())
        deleted += CacheService.delete_pattern(AnalyticsAdminCacheKeys.online_users_pattern())
        return deleted
