from django.core.cache import cache

from src.core.cache import CacheKeyBuilder, CacheService
from src.blog.utils.cache_shared import hash_payload

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
        return "admin:blog:seo:report"

    @staticmethod
    def all_keys(blog_id):
        return CacheKeyBuilder.blog_all_keys(blog_id)

class BlogCacheManager:

    @staticmethod
    def get(key, default=None):
        return CacheService.get(key, default)

    @staticmethod
    def set(key, value, timeout=None):
        return CacheService.set(key, value, timeout)

    @staticmethod
    def delete(key):
        return CacheService.delete(key)

    @staticmethod
    def invalidate_blog(blog_id):
        deleted = CacheService.clear_blog_cache(blog_id)
        deleted += CacheService.delete_pattern("public:blog:detail:*")
        deleted += CacheService.delete_pattern("public:blog:related:*")
        return deleted

    @staticmethod
    def invalidate_blogs(blog_ids):
        return CacheService.clear_blogs_cache(blog_ids)

    @staticmethod
    def invalidate_all_lists():
        deleted = CacheService.clear_blog_lists()
        deleted += CacheService.delete_pattern("public:blog:list:*")
        deleted += CacheService.delete_pattern("public:blog:featured:*")
        deleted += CacheService.delete_pattern("public:blog:related:*")
        return deleted

    @staticmethod
    def invalidate_seo_report():
        return CacheService.delete(BlogCacheKeys.seo_report())

class CategoryCacheKeys:

    @staticmethod
    def root_categories():
        return "admin:blog:category:root"

    @staticmethod
    def tree_admin():
        return "admin:blog:category:tree"

    @staticmethod
    def statistics():
        return "admin:blog:category:stats"

    @staticmethod
    def popular(limit):
        return f"admin:blog:category:popular:{limit}"

    @staticmethod
    def list_admin(params):
        params_hash = hash_payload(params)
        return f"admin:blog:category:list:{params_hash}"

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
        deleted = CacheService.delete_pattern("admin:blog:category:list:*")
        deleted += CacheService.delete_pattern("public:blog:category:*")
        return deleted

    @staticmethod
    def invalidate_popular():
        popular_keys = CategoryCacheKeys.all_popular_keys()
        if popular_keys:
            cache.delete_many(popular_keys)

class TagCacheKeys:

    @staticmethod
    def tag(tag_id):
        return f"admin:blog:tag:{tag_id}"

    @staticmethod
    def popular():
        return "admin:blog:tag:popular"

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
        CacheService.delete_pattern("public:blog:tag:*")

    @staticmethod
    def invalidate_tags(tag_ids):
        keys = TagCacheKeys.all_keys(tag_ids)
        if keys:
            cache.delete_many(keys)
        CacheService.delete_pattern("public:blog:tag:*")

    @staticmethod
    def invalidate_all():
        cache.delete(TagCacheKeys.popular())
        CacheService.delete_pattern("public:blog:tag:*")
