from src.core.cache import CacheService
from src.page.services.terms_page_service import (
    get_terms_page,
    update_terms_page,
)
from src.page.utils.cache_admin import PageAdminCacheKeys
from src.page.utils.cache_ttl import PageCacheTTL

def get_terms_page_data(serializer_class):
    cache_key = PageAdminCacheKeys.terms_page()
    cached_data = CacheService.get(cache_key)
    if cached_data is not None:
        return cached_data

    page = get_terms_page()
    serialized_data = serializer_class(page).data
    CacheService.set(cache_key, serialized_data, PageCacheTTL.ADMIN_PAGE)
    return serialized_data

__all__ = [
    'get_terms_page',
    'get_terms_page_data',
    'update_terms_page',
]
