from django.core.cache import cache


class StatisticsCacheKeys:
    
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
            StatisticsCacheKeys.dashboard(),
            StatisticsCacheKeys.users(),
            StatisticsCacheKeys.admins(),
            StatisticsCacheKeys.content(),
            StatisticsCacheKeys.tickets(),
            StatisticsCacheKeys.emails(),
            StatisticsCacheKeys.system(),
            StatisticsCacheKeys.forms(),
            StatisticsCacheKeys.media(),
            StatisticsCacheKeys.ai(),
            StatisticsCacheKeys.activity_log(),
        ]


class StatisticsCacheManager:
    
    @staticmethod
    def invalidate_dashboard():
        cache.delete(StatisticsCacheKeys.dashboard())
    
    @staticmethod
    def invalidate_users():
        cache.delete(StatisticsCacheKeys.users())
    
    @staticmethod
    def invalidate_admins():
        cache.delete(StatisticsCacheKeys.admins())
    
    @staticmethod
    def invalidate_content():
        cache.delete(StatisticsCacheKeys.content())
    
    @staticmethod
    def invalidate_tickets():
        cache.delete(StatisticsCacheKeys.tickets())
    
    @staticmethod
    def invalidate_emails():
        cache.delete(StatisticsCacheKeys.emails())
    
    @staticmethod
    def invalidate_system():
        cache.delete(StatisticsCacheKeys.system())
    
    @staticmethod
    def invalidate_forms():
        cache.delete(StatisticsCacheKeys.forms())
    
    @staticmethod
    def invalidate_media():
        cache.delete(StatisticsCacheKeys.media())
    
    @staticmethod
    def invalidate_ai():
        cache.delete(StatisticsCacheKeys.ai())
    
    @staticmethod
    def invalidate_activity_log():
        cache.delete(StatisticsCacheKeys.activity_log())
    
    @staticmethod
    def invalidate_time_based(stat_type, days):
        cache.delete(StatisticsCacheKeys.time_based_stats(stat_type, days))
    
    @staticmethod
    def invalidate_all():
        cache.delete_many(StatisticsCacheKeys.all_keys())

