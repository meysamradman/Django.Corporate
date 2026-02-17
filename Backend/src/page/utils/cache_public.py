from src.core.cache import CacheService

from .cache_shared import compose_page_key

class PagePublicCacheKeys:
    @staticmethod
    def about_page():
        return compose_page_key("public", "about")

    @staticmethod
    def terms_page():
        return compose_page_key("public", "terms")

class PagePublicCacheManager:
    @staticmethod
    def invalidate_about_page():
        CacheService.delete(PagePublicCacheKeys.about_page())

    @staticmethod
    def invalidate_terms_page():
        CacheService.delete(PagePublicCacheKeys.terms_page())

    @staticmethod
    def invalidate_all():
        CacheService.delete_many([
            PagePublicCacheKeys.about_page(),
            PagePublicCacheKeys.terms_page(),
        ])
