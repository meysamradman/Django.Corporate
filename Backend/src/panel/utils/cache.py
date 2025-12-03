from django.core.cache import cache


class PanelCacheKeys:
    
    @staticmethod
    def panel_settings():
        return "panel_settings"


class PanelCacheManager:
    
    @staticmethod
    def invalidate_panel_settings():
        cache.delete(PanelCacheKeys.panel_settings())

