from .cache_admin import AnalyticsAdminCacheKeys, AnalyticsAdminCacheManager
from .cache_public import AnalyticsPublicCacheKeys, AnalyticsPublicCacheManager

AnalyticsCacheKeys = AnalyticsAdminCacheKeys
AnalyticsCacheManager = AnalyticsAdminCacheManager

__all__ = [
    "AnalyticsCacheKeys",
    "AnalyticsCacheManager",
    "AnalyticsAdminCacheKeys",
    "AnalyticsAdminCacheManager",
    "AnalyticsPublicCacheKeys",
    "AnalyticsPublicCacheManager",
]

