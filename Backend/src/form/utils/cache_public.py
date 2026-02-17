from src.core.cache import CacheService

from .cache_shared import normalize_platform


class FormPublicCacheKeys:
    @staticmethod
    def fields_for_platform(platform: str):
        return f"public:form:fields:platform:{normalize_platform(platform)}"

    @staticmethod
    def fields_pattern():
        return "public:form:fields:*"


class FormPublicCacheManager:
    @staticmethod
    def invalidate_fields(platform: str | None = None):
        if platform:
            return CacheService.delete(FormPublicCacheKeys.fields_for_platform(platform))
        return CacheService.delete_pattern(FormPublicCacheKeys.fields_pattern())
