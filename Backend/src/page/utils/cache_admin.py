from src.core.cache import CacheService

from .cache_public import PagePublicCacheManager
from .cache_shared import compose_page_key

class PageAdminCacheKeys:
    @staticmethod
    def about_page():
        return compose_page_key("admin", "about")

    @staticmethod
    def terms_page():
        return compose_page_key("admin", "terms")

class PageAdminCacheManager:
    @staticmethod
    def invalidate_about_page():
        CacheService.delete(PageAdminCacheKeys.about_page())
        CacheService.delete("page_about")
        PagePublicCacheManager.invalidate_about_page()

    @staticmethod
    def invalidate_terms_page():
        CacheService.delete(PageAdminCacheKeys.terms_page())
        CacheService.delete("page_terms")
        PagePublicCacheManager.invalidate_terms_page()

    @staticmethod
    def invalidate_all():
        CacheService.delete_many([
            PageAdminCacheKeys.about_page(),
            PageAdminCacheKeys.terms_page(),
            "page_about",
            "page_terms",
        ])
        PagePublicCacheManager.invalidate_all()
