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
    def all_keys():
        return [
            StatisticsCacheKeys.dashboard(),
            StatisticsCacheKeys.users(),
            StatisticsCacheKeys.admins(),
            StatisticsCacheKeys.content(),
            StatisticsCacheKeys.tickets(),
            StatisticsCacheKeys.emails(),
            StatisticsCacheKeys.system(),
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
    def invalidate_all():
        cache.delete_many(StatisticsCacheKeys.all_keys())

