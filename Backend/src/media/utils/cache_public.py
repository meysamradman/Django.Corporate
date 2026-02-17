from src.core.cache import CacheService

from .cache_shared import compose_media_key

class MediaPublicCacheKeys:
    @staticmethod
    def media_list(filters_hash: str):
        return compose_media_key("public", "list", filters_hash)

    @staticmethod
    def media_detail(public_id: str, media_type: str):
        return compose_media_key("public", "detail", f"{media_type}:{public_id}")

    @staticmethod
    def media_by_type(media_type: str, is_active: bool):
        return compose_media_key("public", "by_type", f"{media_type}:{str(is_active).lower()}")

class MediaPublicCacheManager:
    @staticmethod
    def invalidate_media_list():
        CacheService.delete_pattern("public:media:list:*")

    @staticmethod
    def invalidate_media_detail(public_id: str, media_type: str):
        CacheService.delete(MediaPublicCacheKeys.media_detail(public_id, media_type))

    @staticmethod
    def invalidate_media_by_type(media_type: str | None = None):
        if media_type:
            CacheService.delete_pattern(f"public:media:by_type:{media_type}:*")
            return
        CacheService.delete_pattern("public:media:by_type:*")

    @staticmethod
    def invalidate_all():
        CacheService.delete_pattern("public:media:*")
