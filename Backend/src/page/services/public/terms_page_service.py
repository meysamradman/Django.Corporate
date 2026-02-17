from src.core.cache import CacheService
from src.page.services.terms_page_service import get_terms_page
from src.page.utils.cache_public import PagePublicCacheKeys
from src.page.utils.cache_ttl import PageCacheTTL

def get_public_terms_page():
    return get_terms_page()

def get_public_terms_page_data(serializer_class):
    cache_key = PagePublicCacheKeys.terms_page()
    cached_data = CacheService.get(cache_key)
    if cached_data is not None:
        return cached_data

    page = get_public_terms_page()
    serialized_data = serializer_class(page).data
    CacheService.set(cache_key, serialized_data, PageCacheTTL.PUBLIC_PAGE)
    return serialized_data

__all__ = [
    'get_public_terms_page',
    'get_public_terms_page_data',
]
