"""
Cache key utilities and cache management for blog app
"""
from django.core.cache import cache


class BlogCacheKeys:
    """Standardized cache keys for blog app"""
    
    @staticmethod
    def blog(blog_id):
        """Cache key for blog object"""
        return f"blog:{blog_id}"
    
    @staticmethod
    def main_image(blog_id):
        """Cache key for blog main image"""
        return f"blog:main_image:{blog_id}"
    
    @staticmethod
    def seo_data(blog_id):
        """Cache key for blog SEO data"""
        return f"blog:seo_data:{blog_id}"
    
    @staticmethod
    def seo_preview(blog_id):
        """Cache key for blog SEO preview"""
        return f"blog:seo_preview:{blog_id}"
    
    @staticmethod
    def seo_completeness(blog_id):
        """Cache key for blog SEO completeness"""
        return f"blog:seo_completeness:{blog_id}"
    
    @staticmethod
    def structured_data(blog_id):
        """Cache key for blog structured data"""
        return f"blog:structured_data:{blog_id}"
    
    @staticmethod
    def seo_report():
        """Cache key for blog SEO report"""
        return "blog:seo_report"
    
    @staticmethod
    def all_keys(blog_id):
        """Return all cache keys for a blog"""
        return [
            BlogCacheKeys.blog(blog_id),
            BlogCacheKeys.main_image(blog_id),
            BlogCacheKeys.seo_data(blog_id),
            BlogCacheKeys.seo_preview(blog_id),
            BlogCacheKeys.seo_completeness(blog_id),
            BlogCacheKeys.structured_data(blog_id),
        ]


class BlogCacheManager:
    """Cache management utilities for blog operations"""
    
    @staticmethod
    def invalidate_blog(blog_id):
        """Invalidate all cache related to a blog"""
        cache_keys = BlogCacheKeys.all_keys(blog_id)
        # Add additional cache keys that might be used
        additional_keys = [
            f"blog:{blog_id}:main_image_details",
            f"blog:{blog_id}:media_list",
            f"blog:{blog_id}:media_detail",
        ]
        cache_keys.extend(additional_keys)
        cache.delete_many(cache_keys)
    
    @staticmethod
    def invalidate_blogs(blog_ids):
        """Invalidate cache for multiple blogs"""
        all_keys = []
        for pid in blog_ids:
            all_keys.extend(BlogCacheKeys.all_keys(pid))
            # Add additional cache keys for each blog
            additional_keys = [
                f"blog:{pid}:main_image_details",
                f"blog:{pid}:media_list",
                f"blog:{pid}:media_detail",
            ]
            all_keys.extend(additional_keys)
        if all_keys:
            cache.delete_many(all_keys)


class CategoryCacheKeys:
    """Standardized cache keys for category app"""
    
    @staticmethod
    def root_categories():
        """Cache key for root categories"""
        return "blog_root_categories"
    
    @staticmethod
    def tree_admin():
        """Cache key for admin category tree"""
        return "blog_category_tree_admin"
    
    @staticmethod
    def statistics():
        """Cache key for category statistics"""
        return "category_statistics"
    
    @staticmethod
    def popular(limit):
        """Cache key for popular categories"""
        return f"popular_categories_{limit}"
    
    @staticmethod
    def all_keys():
        """Return all base cache keys for categories"""
        return [
            CategoryCacheKeys.root_categories(),
            CategoryCacheKeys.tree_admin(),
            CategoryCacheKeys.statistics(),
        ]
    
    @staticmethod
    def all_popular_keys(limits=None):
        """Return all popular category cache keys"""
        if limits is None:
            limits = [5, 10, 15, 20]
        return [CategoryCacheKeys.popular(limit) for limit in limits]


class CategoryCacheManager:
    """Cache management utilities for category operations"""
    
    @staticmethod
    def invalidate_all():
        """Invalidate all category-related cache"""
        all_keys = CategoryCacheKeys.all_keys()
        all_keys.extend(CategoryCacheKeys.all_popular_keys())
        if all_keys:
            cache.delete_many(all_keys)
    
    @staticmethod
    def invalidate_popular():
        """Invalidate popular categories cache"""
        popular_keys = CategoryCacheKeys.all_popular_keys()
        if popular_keys:
            cache.delete_many(popular_keys)


class TagCacheKeys:
    """Standardized cache keys for tag app"""
    
    @staticmethod
    def tag(tag_id):
        """Cache key for individual tag"""
        return f"blog_tag_{tag_id}"
    
    @staticmethod
    def popular():
        """Cache key for popular tags"""
        return "popular_tags"
    
    @staticmethod
    def all_keys(tag_ids=None):
        """Return all cache keys for tags"""
        keys = [TagCacheKeys.popular()]
        if tag_ids:
            keys.extend([TagCacheKeys.tag(tid) for tid in tag_ids])
        return keys


class TagCacheManager:
    """Cache management utilities for tag operations"""
    
    @staticmethod
    def invalidate_tag(tag_id):
        """Invalidate cache for a specific tag"""
        cache.delete(TagCacheKeys.tag(tag_id))
        cache.delete(TagCacheKeys.popular())
    
    @staticmethod
    def invalidate_tags(tag_ids):
        """Invalidate cache for multiple tags"""
        keys = TagCacheKeys.all_keys(tag_ids)
        if keys:
            cache.delete_many(keys)
    
    @staticmethod
    def invalidate_all():
        """Invalidate all tag-related cache"""
        cache.delete(TagCacheKeys.popular())

