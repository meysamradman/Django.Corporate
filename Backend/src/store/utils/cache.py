from django.core.cache import cache


class ProductCacheKeys:
    """Cache key generators for Product model"""
    
    @staticmethod
    def product(product_id):
        return f"store:product:{product_id}"
    
    @staticmethod
    def main_image(product_id):
        return f"store:product:{product_id}:main_image"
    
    @staticmethod
    def structured_data(product_id):
        return f"store:product:{product_id}:structured_data"
    
    @staticmethod
    def list(filters_hash=None):
        if filters_hash:
            return f"store:product:list:{filters_hash}"
        return "store:product:list"
    
    @staticmethod
    def featured():
        return "store:product:featured"


class ProductCacheManager:
    """Cache management for Product model"""
    
    @staticmethod
    def invalidate_product(product_id):
        """Invalidate all caches for a specific product"""
        keys = [
            ProductCacheKeys.product(product_id),
            ProductCacheKeys.main_image(product_id),
            ProductCacheKeys.structured_data(product_id),
        ]
        cache.delete_many(keys)
    
    @staticmethod
    def invalidate_list():
        """Invalidate product list caches"""
        cache.delete_pattern("store:product:list*")
        cache.delete(ProductCacheKeys.featured())
    
    @staticmethod
    def invalidate_all():
        """Invalidate all product-related caches"""
        ProductCacheManager.invalidate_list()
        cache.delete_pattern("store:product:*")


class ProductCategoryCacheKeys:
    """Cache key generators for ProductCategory model"""
    
    @staticmethod
    def root_categories():
        return "store:category:root"
    
    @staticmethod
    def tree_admin():
        return "store:category:tree_admin"
    
    @staticmethod
    def statistics():
        return "store:category:statistics"
    
    @staticmethod
    def popular(limit):
        return f"store:category:popular:{limit}"
    
    @staticmethod
    def all_keys():
        return [
            ProductCategoryCacheKeys.root_categories(),
            ProductCategoryCacheKeys.tree_admin(),
            ProductCategoryCacheKeys.statistics(),
        ]
    
    @staticmethod
    def all_popular_keys(limits=None):
        if limits is None:
            limits = [5, 10, 15, 20]
        return [ProductCategoryCacheKeys.popular(limit) for limit in limits]


class ProductCategoryCacheManager:
    """Cache management for ProductCategory model"""
    
    @staticmethod
    def invalidate_all():
        """Invalidate all category-related caches"""
        all_keys = ProductCategoryCacheKeys.all_keys()
        all_keys.extend(ProductCategoryCacheKeys.all_popular_keys())
        if all_keys:
            cache.delete_many(all_keys)
    
    @staticmethod
    def invalidate_popular():
        """Invalidate popular category caches"""
        popular_keys = ProductCategoryCacheKeys.all_popular_keys()
        if popular_keys:
            cache.delete_many(popular_keys)


class ProductTagCacheKeys:
    """Cache key generators for ProductTag model"""
    
    @staticmethod
    def tag(tag_id):
        return f"store:tag:{tag_id}"
    
    @staticmethod
    def popular():
        return "store:tag:popular"
    
    @staticmethod
    def all_keys(tag_ids=None):
        keys = [ProductTagCacheKeys.popular()]
        if tag_ids:
            keys.extend([ProductTagCacheKeys.tag(tid) for tid in tag_ids])
        return keys


class ProductTagCacheManager:
    """Cache management for ProductTag model"""
    
    @staticmethod
    def invalidate_tag(tag_id):
        """Invalidate all caches for a specific tag"""
        cache.delete(ProductTagCacheKeys.tag(tag_id))
        cache.delete(ProductTagCacheKeys.popular())
    
    @staticmethod
    def invalidate_tags(tag_ids):
        """Invalidate caches for multiple tags"""
        keys = ProductTagCacheKeys.all_keys(tag_ids)
        if keys:
            cache.delete_many(keys)
    
    @staticmethod
    def invalidate_all():
        """Invalidate all tag-related caches"""
        cache.delete(ProductTagCacheKeys.popular())
