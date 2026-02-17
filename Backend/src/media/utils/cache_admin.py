from src.core.cache import CacheService

from .cache_public import MediaPublicCacheManager
from .cache_shared import compose_media_key

class MediaAdminCacheKeys:
    @staticmethod
    def media_list(filters_hash: str):
        return compose_media_key("admin", "list", filters_hash)

    @staticmethod
    def media_detail(media_id: int):
        return compose_media_key("admin", "detail", media_id)

class MediaAdminCacheManager:
    @staticmethod
    def invalidate_media_list():
        CacheService.delete_pattern("admin:media:list:*")

    @staticmethod
    def invalidate_media_detail(media_id: int):
        CacheService.delete(MediaAdminCacheKeys.media_detail(media_id))

    @staticmethod
    def invalidate_type_scope(media_type: str | None = None, public_id: str | None = None):
        MediaAdminCacheManager.invalidate_media_list()
        MediaPublicCacheManager.invalidate_media_list()
        MediaPublicCacheManager.invalidate_media_by_type(media_type)
        if media_type and public_id:
            MediaPublicCacheManager.invalidate_media_detail(public_id, media_type)

    @staticmethod
    def invalidate_all():
        CacheService.delete_pattern("admin:media:*")
        MediaPublicCacheManager.invalidate_all()
