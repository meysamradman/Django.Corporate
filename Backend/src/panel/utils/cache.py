from src.core.cache import CacheService

class PanelCacheKeys:
    
    @staticmethod
    def panel_settings():
        return "panel_settings"

class PanelCacheManager:
    
    @staticmethod
    def invalidate_panel_settings():
        return CacheService.delete(PanelCacheKeys.panel_settings())

