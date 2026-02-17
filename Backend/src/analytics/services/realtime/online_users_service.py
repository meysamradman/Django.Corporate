import time

from src.core.cache import CacheService
from src.analytics.utils.cache_admin import AnalyticsAdminCacheKeys
from src.analytics.utils.cache_ttl import AnalyticsCacheTTL


class OnlineUsersRealtimeService:
    @classmethod
    def touch_session(cls, session_id: str, site_id: str = "default") -> None:
        if not session_id:
            return

        now_ts = time.time()
        key = AnalyticsAdminCacheKeys.online_users(site_id)
        CacheService.zadd(key, {session_id: now_ts})
        cls._cleanup_stale(site_id=site_id, now_ts=now_ts)

    @classmethod
    def get_online_users(cls, site_id: str = "default") -> int:
        now_ts = time.time()
        cls._cleanup_stale(site_id=site_id, now_ts=now_ts)
        key = AnalyticsAdminCacheKeys.online_users(site_id)
        return CacheService.zcard(key)

    @classmethod
    def _cleanup_stale(cls, site_id: str, now_ts: float) -> None:
        key = AnalyticsAdminCacheKeys.online_users(site_id)
        threshold = now_ts - AnalyticsCacheTTL.ONLINE_USERS_WINDOW_SECONDS
        CacheService.zremrangebyscore(key, float("-inf"), threshold)
