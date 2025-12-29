"""Real Estate Cache Management - Using Core Cache System"""
from src.core.cache import CacheKeyBuilder, CacheService, CacheTTL


class PropertyCacheKeys:
    """Cache key generators for Property model - Wrapper around Core"""
    
    @staticmethod
    def property_detail(property_id: int) -> str:
        """Property detail cache key"""
        return CacheKeyBuilder.property_detail(property_id)
    
    @staticmethod
    def main_image(property_id: int) -> str:
        """Property main image cache key"""
        return CacheKeyBuilder.property_main_image(property_id)
    
    @staticmethod
    def structured_data(property_id: int) -> str:
        """Property structured data cache key"""
        return CacheKeyBuilder.property_structured_data(property_id)
    
    @staticmethod
    def seo_preview(property_id: int) -> str:
        """Property SEO preview cache key"""
        return CacheKeyBuilder.property_seo_preview(property_id)
    
    @staticmethod
    def seo_completeness(property_id: int) -> str:
        """Property SEO completeness cache key"""
        return CacheKeyBuilder.property_seo_completeness(property_id)
    
    @staticmethod
    def seo_data(property_id: int) -> str:
        """Property SEO data cache key"""
        return CacheKeyBuilder.property_seo_data(property_id)
    
    @staticmethod
    def list_admin(params: dict) -> str:
        """Property admin list cache key with filters"""
        return CacheKeyBuilder.property_list_admin(params)
    
    @staticmethod
    def featured() -> str:
        """Featured properties cache key"""
        return CacheKeyBuilder.property_featured()
    
    @staticmethod
    def statistics() -> str:
        """Property statistics cache key"""
        return CacheKeyBuilder.property_statistics()
    
    @staticmethod
    def all_keys(property_id: int) -> list[str]:
        """Get all cache keys for a specific property"""
        return CacheKeyBuilder.property_all_keys(property_id)


class PropertyCacheManager:
    """Cache management for Property model - Safe & Simple"""
    
    # Cache timeouts (TTL)
    TTL_DETAIL = CacheTTL.DETAIL_MEDIUM      # 30 minutes
    TTL_LIST = CacheTTL.LIST_SHORT           # 5 minutes
    TTL_SEO = CacheTTL.DETAIL_LONG          # 60 minutes
    TTL_STATS = CacheTTL.LIST_MEDIUM        # 15 minutes
    
    @staticmethod
    def get(key: str, default=None):
        """Safe get from cache"""
        return CacheService.get(key, default)
    
    @staticmethod
    def set(key: str, value, timeout: int | None = None):
        """Safe set to cache"""
        return CacheService.set(key, value, timeout)
    
    @staticmethod
    def delete(key: str):
        """Safe delete from cache"""
        return CacheService.delete(key)
    
    @staticmethod
    def invalidate_property(property_id: int) -> int:
        """
        Invalidate all caches for a specific property
        Returns: number of keys deleted
        """
        return CacheService.clear_property_cache(property_id)
    
    @staticmethod
    def invalidate_properties(property_ids: list[int]) -> int:
        """
        Invalidate caches for multiple properties
        Returns: number of keys deleted
        """
        return CacheService.clear_properties_cache(property_ids)
    
    @staticmethod
    def invalidate_list() -> int:
        """
        Invalidate property list caches
        Returns: number of keys deleted
        """
        return CacheService.clear_property_lists()
    
    @staticmethod
    def invalidate_statistics() -> int:
        """
        Invalidate property statistics cache
        Returns: number of keys deleted
        """
        return CacheService.clear_property_statistics()
    
    @staticmethod
    def invalidate_all() -> int:
        """
        Invalidate ALL property-related caches
        Returns: number of keys deleted
        """
        from src.core.cache import CacheNamespace
        pattern = f"{CacheNamespace.PROPERTY_LIST}:*"
        deleted = CacheService.delete_pattern(pattern)
        
        pattern = f"{CacheNamespace.PROPERTY_DETAIL}:*"
        deleted += CacheService.delete_pattern(pattern)
        
        pattern = f"{CacheNamespace.PROPERTY_SEO}:*"
        deleted += CacheService.delete_pattern(pattern)
        
        deleted += PropertyCacheManager.invalidate_statistics()
        
        return deleted


# ============================================
# Property Tag Cache (Simple)
# ============================================

class PropertyTagCacheKeys:
    """Cache key generators for PropertyTag model"""
    
    NAMESPACE = "property:tag"
    
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
    """Cache management for PropertyTag model"""
    
    @staticmethod
    def invalidate_tag(tag_id: int) -> int:
        """Invalidate cache for a specific tag"""
        keys = [
            PropertyTagCacheKeys.tag(tag_id),
            PropertyTagCacheKeys.popular()
        ]
        return CacheService.delete_many(keys)
    
    @staticmethod
    def invalidate_tags(tag_ids: list[int]) -> int:
        """Invalidate caches for multiple tags"""
        keys = PropertyTagCacheKeys.all_keys(tag_ids)
        return CacheService.delete_many(keys)
    
    @staticmethod
    def invalidate_all() -> int:
        """Invalidate all tag-related caches"""
        pattern = f"{PropertyTagCacheKeys.NAMESPACE}:*"
        return CacheService.delete_pattern(pattern)


# ============================================
# Property Type Cache (Tree Structure)
# ============================================

class TypeCacheKeys:
    """Cache key generators for PropertyType model (Tree)"""
    
    NAMESPACE = "property:type"
    
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
    """Cache management for PropertyType model"""
    
    @staticmethod
    def invalidate_type(type_id: int) -> int:
        """Invalidate cache for a specific type"""
        keys = TypeCacheKeys.all_keys([type_id])
        return CacheService.delete_many(keys)
    
    @staticmethod
    def invalidate_types(type_ids: list[int]) -> int:
        """Invalidate caches for multiple types"""
        keys = TypeCacheKeys.all_keys(type_ids)
        return CacheService.delete_many(keys)
    
    @staticmethod
    def invalidate_all() -> int:
        """Invalidate all type-related caches (Full clear)"""
        pattern = f"{TypeCacheKeys.NAMESPACE}:*"
        return CacheService.delete_pattern(pattern)
