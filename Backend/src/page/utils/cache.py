from src.core.cache import CacheService

class PageCacheKeys:
    
    @staticmethod
    def about_page():
        return "page_about"
    
    @staticmethod
    def terms_page():
        return "page_terms"
    
    @staticmethod
    def all_keys():
        return [
            PageCacheKeys.about_page(),
            PageCacheKeys.terms_page(),
        ]

class PageCacheManager:
    
    @staticmethod
    def invalidate_about_page():
        return CacheService.delete(PageCacheKeys.about_page())
    
    @staticmethod
    def invalidate_terms_page():
        return CacheService.delete(PageCacheKeys.terms_page())
    
    @staticmethod
    def invalidate_all():
        return CacheService.delete_many(PageCacheKeys.all_keys())

