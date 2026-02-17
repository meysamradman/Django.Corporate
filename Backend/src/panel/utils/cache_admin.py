from src.core.cache import CacheService

class PanelCacheKeys:

    @staticmethod
    def panel_settings():
        return "admin:panel:settings"

    @staticmethod
    def export_rate_limit(user_id):
        return f"admin:panel:db_export:rate_limit:{user_id}"

class PanelCacheManager:

    @staticmethod
    def invalidate_panel_settings():
        return CacheService.delete(PanelCacheKeys.panel_settings())
