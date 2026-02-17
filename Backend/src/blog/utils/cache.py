from django.core.cache import cache
from src.core.cache import CacheKeyBuilder, CacheService

class BlogCacheKeys:
    
    @staticmethod
    def blog(blog_id):
        return CacheKeyBuilder.blog_detail(blog_id)
    
    @staticmethod
    def list_admin(params):
        return CacheKeyBuilder.blog_list_admin(params)
    
    @staticmethod
    def main_image(blog_id):
        return CacheKeyBuilder.blog_main_image(blog_id)
    
    @staticmethod
    def seo_data(blog_id):
        return CacheKeyBuilder.blog_seo_data(blog_id)
    
    @staticmethod
    def seo_preview(blog_id):
        return CacheKeyBuilder.blog_seo_preview(blog_id)
    
    @staticmethod
    def seo_completeness(blog_id):
        return CacheKeyBuilder.blog_seo_completeness(blog_id)
    
    @staticmethod
    def structured_data(blog_id):
        return CacheKeyBuilder.blog_structured_data(blog_id)
    
    @staticmethod
    def seo_report():
        return "blog:seo_report"
    
    @staticmethod
    def all_keys(blog_id):
        return CacheKeyBuilder.blog_all_keys(blog_id)

class BlogCacheManager:
    
    @staticmethod
    def invalidate_blog(blog_id):
        return CacheService.clear_blog_cache(blog_id)
    
    @staticmethod
    def invalidate_blogs(blog_ids):
        return CacheService.clear_blogs_cache(blog_ids)
    
    @staticmethod
    def invalidate_all_lists():
        return CacheService.clear_blog_lists()

class CategoryCacheKeys:
    
    @staticmethod
    def root_categories():
        return "blog_root_categories"
    
    @staticmethod
    def tree_admin():
        return "blog_category_tree_admin"
    
    @staticmethod
    def statistics():
        return "blog_category_statistics"
    
    @staticmethod
    def popular(limit):
        return f"blog_popular_categories_{limit}"
    
    @staticmethod
    def list_admin(params):
        import hashlib
        import json
        params_str = json.dumps(params, sort_keys=True)
        params_hash = hashlib.md5(params_str.encode()).hexdigest()[:8]
        return f"blog_category_list_admin:{params_hash}"
    
    @staticmethod
    def all_keys():
        return [
            CategoryCacheKeys.root_categories(),
            CategoryCacheKeys.tree_admin(),
            CategoryCacheKeys.statistics(),
        ]
    
    @staticmethod
    def all_popular_keys(limits=None):
        if limits is None:
            limits = [5, 10, 15, 20]
        return [CategoryCacheKeys.popular(limit) for limit in limits]

class CategoryCacheManager:
    
    @staticmethod
    def invalidate_all():
        all_keys = CategoryCacheKeys.all_keys()
        all_keys.extend(CategoryCacheKeys.all_popular_keys())
        if all_keys:
            cache.delete_many(all_keys)
        return CacheService.delete_pattern("*blog_category_list_admin:*")
    
    @staticmethod
    def invalidate_popular():
        popular_keys = CategoryCacheKeys.all_popular_keys()
        if popular_keys:
            cache.delete_many(popular_keys)

class TagCacheKeys:
    
    @staticmethod
    def tag(tag_id):
        return f"blog_tag_{tag_id}"
    
    @staticmethod
    def popular():
        return "blog_popular_tags"
    
    @staticmethod
    def all_keys(tag_ids=None):
        keys = [TagCacheKeys.popular()]
        if tag_ids:
            keys.extend([TagCacheKeys.tag(tid) for tid in tag_ids])
        return keys

class TagCacheManager:
    
    @staticmethod
    def invalidate_tag(tag_id):
        cache.delete(TagCacheKeys.tag(tag_id))
        cache.delete(TagCacheKeys.popular())
    
    @staticmethod
    def invalidate_tags(tag_ids):
        keys = TagCacheKeys.all_keys(tag_ids)
        if keys:
            cache.delete_many(keys)
    
    @staticmethod
    def invalidate_all():
        cache.delete(TagCacheKeys.popular())

