class AnalyticsPublicCacheKeys:
    @staticmethod
    def traffic_dashboard(site_id: str = "default") -> str:
        return f"public:analytics:traffic:dashboard:{site_id}"

    @staticmethod
    def monthly_stats(site_id: str = "default") -> str:
        return f"public:analytics:traffic:monthly:{site_id}"

    @staticmethod
    def traffic_dashboard_pattern() -> str:
        return "public:analytics:traffic:dashboard:*"

class AnalyticsPublicCacheManager:
    @staticmethod
    def invalidate_traffic_dashboard(site_id: str = "default") -> bool:
        from src.core.cache import CacheService
        return CacheService.delete(AnalyticsPublicCacheKeys.traffic_dashboard(site_id))

    @staticmethod
    def invalidate_monthly_stats(site_id: str = "default") -> bool:
        from src.core.cache import CacheService
        return CacheService.delete(AnalyticsPublicCacheKeys.monthly_stats(site_id))

    @staticmethod
    def invalidate_all_traffic_dashboards() -> int:
        from src.core.cache import CacheService
        return CacheService.delete_pattern(AnalyticsPublicCacheKeys.traffic_dashboard_pattern())
