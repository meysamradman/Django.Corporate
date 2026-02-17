from django.core.cache import cache
from src.core.cache import CacheService

class AnalyticsCacheKeys:
    
    @staticmethod
    def dashboard():
        return "admin_stats_dashboard_overview"
    
    @staticmethod
    def users():
        return "admin_stats_users"
    
    @staticmethod
    def admins():
        return "admin_stats_admins"
    
    @staticmethod
    def content():
        return "admin_stats_content"
    
    @staticmethod
    def tickets():
        return "admin_stats_tickets"
    
    @staticmethod
    def emails():
        return "admin_stats_emails"
    
    @staticmethod
    def system():
        return "admin_stats_system"
    
    @staticmethod
    def forms():
        return "admin_stats_forms"
    
    @staticmethod
    def media():
        return "admin_stats_media"
    
    @staticmethod
    def ai():
        return "admin_stats_ai"
    
    @staticmethod
    def activity_log():
        return "admin_stats_activity_log"

    @staticmethod
    def traffic_dashboard(site_id: str = "default"):
        return f"analytics:dashboard:{site_id}"

    @staticmethod
    def monthly_stats():
        return "analytics:monthly_stats"

    @staticmethod
    def content_trend():
        return "analytics:content_trend"

    @staticmethod
    def traffic_dashboard_pattern():
        return "analytics:dashboard:*"
    
    @staticmethod
    def time_based_stats(stat_type, days):
        return f"admin_stats_{stat_type}_time_{days}"
    
    @staticmethod
    def all_keys():
        return [
            AnalyticsCacheKeys.dashboard(),
            AnalyticsCacheKeys.users(),
            AnalyticsCacheKeys.admins(),
            AnalyticsCacheKeys.content(),
            AnalyticsCacheKeys.tickets(),
            AnalyticsCacheKeys.emails(),
            AnalyticsCacheKeys.system(),
            AnalyticsCacheKeys.forms(),
            AnalyticsCacheKeys.media(),
            AnalyticsCacheKeys.ai(),
            AnalyticsCacheKeys.activity_log(),
        ]

class AnalyticsCacheManager:
    
    @staticmethod
    def invalidate_dashboard():
        return CacheService.delete(AnalyticsCacheKeys.dashboard())
    
    @staticmethod
    def invalidate_users():
        return CacheService.delete(AnalyticsCacheKeys.users())
    
    @staticmethod
    def invalidate_admins():
        return CacheService.delete(AnalyticsCacheKeys.admins())
    
    @staticmethod
    def invalidate_content():
        return CacheService.delete(AnalyticsCacheKeys.content())
    
    @staticmethod
    def invalidate_tickets():
        return CacheService.delete(AnalyticsCacheKeys.tickets())
    
    @staticmethod
    def invalidate_emails():
        return CacheService.delete(AnalyticsCacheKeys.emails())
    
    @staticmethod
    def invalidate_system():
        return CacheService.delete(AnalyticsCacheKeys.system())
    
    @staticmethod
    def invalidate_forms():
        return CacheService.delete(AnalyticsCacheKeys.forms())
    
    @staticmethod
    def invalidate_media():
        return CacheService.delete(AnalyticsCacheKeys.media())
    
    @staticmethod
    def invalidate_ai():
        return CacheService.delete(AnalyticsCacheKeys.ai())
    
    @staticmethod
    def invalidate_activity_log():
        return CacheService.delete(AnalyticsCacheKeys.activity_log())

    @staticmethod
    def invalidate_traffic_dashboard(site_id: str = "default"):
        return CacheService.delete(AnalyticsCacheKeys.traffic_dashboard(site_id))

    @staticmethod
    def invalidate_all_traffic_dashboards():
        return CacheService.delete_pattern(AnalyticsCacheKeys.traffic_dashboard_pattern())

    @staticmethod
    def invalidate_monthly_stats():
        return CacheService.delete(AnalyticsCacheKeys.monthly_stats())

    @staticmethod
    def invalidate_content_trend():
        return CacheService.delete(AnalyticsCacheKeys.content_trend())
    
    @staticmethod
    def invalidate_time_based(stat_type, days):
        return CacheService.delete(AnalyticsCacheKeys.time_based_stats(stat_type, days))
    
    @staticmethod
    def invalidate_all():
        return CacheService.delete_many(AnalyticsCacheKeys.all_keys())

