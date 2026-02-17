
from src.core.cache import CacheKeyBuilder, CacheService, CacheTTL

class PropertyCacheKeys:

    @staticmethod
    def property_detail(property_id: int) -> str:
        
        return CacheKeyBuilder.property_detail(property_id)
    
    @staticmethod
    def main_image(property_id: int) -> str:
        
        return CacheKeyBuilder.property_main_image(property_id)
    
    @staticmethod
    def structured_data(property_id: int) -> str:
        
        return CacheKeyBuilder.property_structured_data(property_id)
    
    @staticmethod
    def seo_preview(property_id: int) -> str:
        
        return CacheKeyBuilder.property_seo_preview(property_id)
    
    @staticmethod
    def seo_completeness(property_id: int) -> str:
        
        return CacheKeyBuilder.property_seo_completeness(property_id)
    
    @staticmethod
    def seo_data(property_id: int) -> str:
        
        return CacheKeyBuilder.property_seo_data(property_id)
    
    @staticmethod
    def list_admin(params: dict) -> str:
        
        return CacheKeyBuilder.property_list_admin(params)
    
    @staticmethod
    def featured() -> str:
        
        return CacheKeyBuilder.property_featured()
    
    @staticmethod
    def statistics() -> str:
        
        return CacheKeyBuilder.property_statistics()

    @staticmethod
    def statistics_seo_report() -> str:
        
        return f"{CacheKeyBuilder.property_statistics()}:seo_report"
    
    @staticmethod
    def all_keys(property_id: int) -> list[str]:
        
        return CacheKeyBuilder.property_all_keys(property_id)

class PropertyCacheManager:

    TTL_DETAIL = CacheTTL.DETAIL_MEDIUM      # 30 minutes
    TTL_LIST = CacheTTL.LIST_SHORT           # 5 minutes
    TTL_SEO = CacheTTL.DETAIL_LONG          # 60 minutes
    TTL_STATS = CacheTTL.LIST_MEDIUM        # 15 minutes
    
    @staticmethod
    def get(key: str, default=None):
        
        return CacheService.get(key, default)
    
    @staticmethod
    def set(key: str, value, timeout: int | None = None):
        
        return CacheService.set(key, value, timeout)
    
    @staticmethod
    def delete(key: str):
        
        return CacheService.delete(key)
    
    @staticmethod
    def invalidate_property(property_id: int) -> int:
        
        return CacheService.clear_property_cache(property_id)
    
    @staticmethod
    def invalidate_properties(property_ids: list[int]) -> int:
        
        return CacheService.clear_properties_cache(property_ids)
    
    @staticmethod
    def invalidate_list() -> int:
        
        return CacheService.clear_property_lists()
    
    @staticmethod
    def invalidate_statistics() -> int:
        
        keys = [
            PropertyCacheKeys.statistics(),
            PropertyCacheKeys.statistics_seo_report(),
        ]
        return CacheService.delete_many(keys)
    
    @staticmethod
    def invalidate_all() -> int:
        
        from src.core.cache import CacheNamespace
        pattern = f"{CacheNamespace.PROPERTY_LIST}:*"
        deleted = CacheService.delete_pattern(pattern)
        
        pattern = f"{CacheNamespace.PROPERTY_DETAIL}:*"
        deleted += CacheService.delete_pattern(pattern)
        
        pattern = f"{CacheNamespace.PROPERTY_SEO}:*"
        deleted += CacheService.delete_pattern(pattern)
        
        deleted += PropertyCacheManager.invalidate_statistics()
        
        return deleted

class PropertyTagCacheKeys:

    NAMESPACE = "real_estate:property:tag"
    
    @staticmethod
    def tag(tag_id: int) -> str:
        return f"{PropertyTagCacheKeys.NAMESPACE}:{tag_id}"
    
    @staticmethod
    def popular() -> str:
        return f"{PropertyTagCacheKeys.NAMESPACE}:popular"
    
    @staticmethod
    def all_keys(tag_ids: list[int] | None = None) -> list[str]:
        keys = [PropertyTagCacheKeys.popular()]
        if tag_ids:
            keys.extend([PropertyTagCacheKeys.tag(tid) for tid in tag_ids])
        return keys

class PropertyTagCacheManager:

    @staticmethod
    def invalidate_tag(tag_id: int) -> int:
        
        keys = [
            PropertyTagCacheKeys.tag(tag_id),
            PropertyTagCacheKeys.popular()
        ]
        return CacheService.delete_many(keys)
    
    @staticmethod
    def invalidate_tags(tag_ids: list[int]) -> int:
        
        keys = PropertyTagCacheKeys.all_keys(tag_ids)
        return CacheService.delete_many(keys)
    
    @staticmethod
    def invalidate_all() -> int:
        
        pattern = f"{PropertyTagCacheKeys.NAMESPACE}:*"
        return CacheService.delete_pattern(pattern)

class TypeCacheKeys:

    NAMESPACE = "real_estate:property:type"
    
    @staticmethod
    def type_detail(type_id: int) -> str:
        return f"{TypeCacheKeys.NAMESPACE}:{type_id}"
    
    @staticmethod
    def root_types() -> str:
        return f"{TypeCacheKeys.NAMESPACE}:roots"
    
    @staticmethod
    def tree_admin() -> str:
        return f"{TypeCacheKeys.NAMESPACE}:tree:admin"
    
    @staticmethod
    def tree_public() -> str:
        return f"{TypeCacheKeys.NAMESPACE}:tree:public"
    
    @staticmethod
    def popular(limit: int = 10) -> str:
        return f"{TypeCacheKeys.NAMESPACE}:popular:{limit}"
    
    @staticmethod
    def statistics() -> str:
        return f"{TypeCacheKeys.NAMESPACE}:statistics"
    
    @staticmethod
    def all_keys(type_ids: list[int] | None = None) -> list[str]:
        keys = [
            TypeCacheKeys.root_types(),
            TypeCacheKeys.tree_admin(),
            TypeCacheKeys.tree_public(),
            TypeCacheKeys.statistics()
        ]
        if type_ids:
            keys.extend([TypeCacheKeys.type_detail(tid) for tid in type_ids])
        return keys

class TypeCacheManager:

    @staticmethod
    def invalidate_type(type_id: int) -> int:
        
        keys = TypeCacheKeys.all_keys([type_id])
        return CacheService.delete_many(keys)
    
    @staticmethod
    def invalidate_types(type_ids: list[int]) -> int:
        
        keys = TypeCacheKeys.all_keys(type_ids)
        return CacheService.delete_many(keys)
    
    @staticmethod
    def invalidate_all() -> int:
        
        pattern = f"{TypeCacheKeys.NAMESPACE}:*"
        return CacheService.delete_pattern(pattern)
