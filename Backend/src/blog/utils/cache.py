from django.core.cache import cache


class BlogCacheKeys:
    
    @staticmethod
    def blog(blog_id):
        return f"blog:{blog_id}"
    
    @staticmethod
    def main_image(blog_id):
        return f"blog:main_image:{blog_id}"
    
    @staticmethod
    def seo_data(blog_id):
        return f"blog:seo_data:{blog_id}"
    
    @staticmethod
    def seo_preview(blog_id):
        return f"blog:seo_preview:{blog_id}"
    
    @staticmethod
    def seo_completeness(blog_id):
        return f"blog:seo_completeness:{blog_id}"
    
    @staticmethod
    def structured_data(blog_id):
        return f"blog:structured_data:{blog_id}"
    
    @staticmethod
    def seo_report():
        return "blog:seo_report"
    
    @staticmethod
    def all_keys(blog_id):
        return [
            BlogCacheKeys.blog(blog_id),
            BlogCacheKeys.main_image(blog_id),
            BlogCacheKeys.seo_data(blog_id),
            BlogCacheKeys.seo_preview(blog_id),
            BlogCacheKeys.seo_completeness(blog_id),
            BlogCacheKeys.structured_data(blog_id),
        ]


class BlogCacheManager:
    
    @staticmethod
    def invalidate_blog(blog_id):
        cache_keys = BlogCacheKeys.all_keys(blog_id)
        additional_keys = [
            f"blog:{blog_id}:main_image_details",
            f"blog:{blog_id}:media_list",
            f"blog:{blog_id}:media_detail",
        ]
        cache_keys.extend(additional_keys)
        cache.delete_many(cache_keys)
    
    @staticmethod
    def invalidate_blogs(blog_ids):
        all_keys = []
        for pid in blog_ids:
            all_keys.extend(BlogCacheKeys.all_keys(pid))
            additional_keys = [
                f"blog:{pid}:main_image_details",
                f"blog:{pid}:media_list",
                f"blog:{pid}:media_detail",
            ]
            all_keys.extend(additional_keys)
        if all_keys:
            cache.delete_many(all_keys)


class CategoryCacheKeys:
    
    @staticmethod
    def root_categories():
        return "blog_root_categories"
    
    @staticmethod
    def tree_admin():
        return "blog_category_tree_admin"
    
    @staticmethod
    def statistics():
        return "category_statistics"
    
    @staticmethod
    def popular(limit):
        return f"popular_categories_{limit}"
    
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
        return "popular_tags"
    
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

