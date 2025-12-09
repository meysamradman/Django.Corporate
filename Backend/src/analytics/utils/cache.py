from django.core.cache import cache


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
        cache.delete(AnalyticsCacheKeys.dashboard())
    
    @staticmethod
    def invalidate_users():
        cache.delete(AnalyticsCacheKeys.users())
    
    @staticmethod
    def invalidate_admins():
        cache.delete(AnalyticsCacheKeys.admins())
    
    @staticmethod
    def invalidate_content():
        cache.delete(AnalyticsCacheKeys.content())
    
    @staticmethod
    def invalidate_tickets():
        cache.delete(AnalyticsCacheKeys.tickets())
    
    @staticmethod
    def invalidate_emails():
        cache.delete(AnalyticsCacheKeys.emails())
    
    @staticmethod
    def invalidate_system():
        cache.delete(AnalyticsCacheKeys.system())
    
    @staticmethod
    def invalidate_forms():
        cache.delete(AnalyticsCacheKeys.forms())
    
    @staticmethod
    def invalidate_media():
        cache.delete(AnalyticsCacheKeys.media())
    
    @staticmethod
    def invalidate_ai():
        cache.delete(AnalyticsCacheKeys.ai())
    
    @staticmethod
    def invalidate_activity_log():
        cache.delete(AnalyticsCacheKeys.activity_log())
    
    @staticmethod
    def invalidate_time_based(stat_type, days):
        cache.delete(AnalyticsCacheKeys.time_based_stats(stat_type, days))
    
    @staticmethod
    def invalidate_all():
        cache.delete_many(AnalyticsCacheKeys.all_keys())

