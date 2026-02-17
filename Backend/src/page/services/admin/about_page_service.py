from src.core.cache import CacheService
from src.page.services.about_page_service import (
    get_about_page,
    update_about_page,
)
from src.page.utils.cache_admin import PageAdminCacheKeys
from src.page.utils.cache_ttl import PageCacheTTL


def get_about_page_data(serializer_class):
    cache_key = PageAdminCacheKeys.about_page()
    cached_data = CacheService.get(cache_key)
    if cached_data is not None:
        return cached_data

    page = get_about_page()
    serialized_data = serializer_class(page).data
    CacheService.set(cache_key, serialized_data, PageCacheTTL.ADMIN_PAGE)
    return serialized_data

__all__ = [
    'get_about_page',
    'get_about_page_data',
    'update_about_page',
]
