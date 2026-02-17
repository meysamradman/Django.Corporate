from src.core.cache import CacheService

from .cache_shared import normalize_platform


class FormAdminCacheKeys:
    @staticmethod
    def fields_for_platform(platform: str):
        return f"admin:form:fields:platform:{normalize_platform(platform)}"

    @staticmethod
    def all_fields():
        return "admin:form:fields:all"

    @staticmethod
    def active_fields():
        return "admin:form:fields:active"

    @staticmethod
    def field_by_key(field_key: str):
        return f"admin:form:field:key:{field_key}"

    @staticmethod
    def field_by_id(field_id: int):
        return f"admin:form:field:id:{field_id}"


class FormAdminCacheManager:
    @staticmethod
    def invalidate_fields():
        CacheService.delete(FormAdminCacheKeys.all_fields())
        CacheService.delete(FormAdminCacheKeys.active_fields())
        CacheService.delete_pattern("admin:form:fields:platform:*")
        CacheService.delete_pattern("public:form:fields:*")

    @staticmethod
    def invalidate_field(field_id: int | None = None, field_key: str | None = None):
        if field_id is not None:
            CacheService.delete(FormAdminCacheKeys.field_by_id(field_id))
        if field_key:
            CacheService.delete(FormAdminCacheKeys.field_by_key(field_key))
        FormAdminCacheManager.invalidate_fields()

    @staticmethod
    def invalidate_platform(platform: str):
        CacheService.delete(FormAdminCacheKeys.fields_for_platform(platform))
        CacheService.delete(f"public:form:fields:platform:{normalize_platform(platform)}")
        FormAdminCacheManager.invalidate_fields()
