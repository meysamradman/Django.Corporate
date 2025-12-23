from django.core.cache import cache


class PropertyCacheKeys:
    """Cache key generators for Property model"""
    
    @staticmethod
    def property(property_id):
        return f"real_estate:property:{property_id}"
    
    @staticmethod
    def main_image(property_id):
        return f"real_estate:property:{property_id}:main_image"
    
    @staticmethod
    def structured_data(property_id):
        return f"real_estate:property:{property_id}:structured_data"
    
    @staticmethod
    def list(filters_hash=None):
        if filters_hash:
            return f"real_estate:property:list:{filters_hash}"
        return "real_estate:property:list"
    
    @staticmethod
    def featured():
        return "real_estate:property:featured"
    
    @staticmethod
    def statistics():
        return "real_estate:property:statistics"
    
    @staticmethod
    def seo_preview(property_id):
        return f"real_estate:property:{property_id}:seo_preview"
    
    @staticmethod
    def seo_completeness(property_id):
        return f"real_estate:property:{property_id}:seo_completeness"


class PropertyCacheManager:
    """Cache management for Property model"""
    
    @staticmethod
    def invalidate_property(property_id):
        """Invalidate all caches for a specific property"""
        keys = [
            PropertyCacheKeys.property(property_id),
            PropertyCacheKeys.main_image(property_id),
            PropertyCacheKeys.structured_data(property_id),
        ]
        cache.delete_many(keys)
    
    @staticmethod
    def invalidate_list():
        """Invalidate property list caches"""
        cache.delete_pattern("real_estate:property:list*")
        cache.delete(PropertyCacheKeys.featured())
    
    @staticmethod
    def invalidate_all():
        """Invalidate all property-related caches"""
        PropertyCacheManager.invalidate_list()
        cache.delete_pattern("real_estate:property:*")


class PropertyTagCacheKeys:
    """Cache key generators for PropertyTag model"""
    
    @staticmethod
    def tag(tag_id):
        return f"real_estate:tag:{tag_id}"
    
    @staticmethod
    def popular():
        return "real_estate:tag:popular"
    
    @staticmethod
    def all_keys(tag_ids=None):
        keys = [PropertyTagCacheKeys.popular()]
        if tag_ids:
            keys.extend([PropertyTagCacheKeys.tag(tid) for tid in tag_ids])
        return keys


class PropertyTagCacheManager:
    """Cache management for PropertyTag model"""
    
    @staticmethod
    def invalidate_tag(tag_id):
        """Invalidate all caches for a specific tag"""
        cache.delete(PropertyTagCacheKeys.tag(tag_id))
        cache.delete(PropertyTagCacheKeys.popular())
    
    @staticmethod
    def invalidate_tags(tag_ids):
        """Invalidate caches for multiple tags"""
        keys = PropertyTagCacheKeys.all_keys(tag_ids)
        if keys:
            cache.delete_many(keys)
    
    @staticmethod
    def invalidate_all():
        """Invalidate all tag-related caches"""
        cache.delete(PropertyTagCacheKeys.popular())
