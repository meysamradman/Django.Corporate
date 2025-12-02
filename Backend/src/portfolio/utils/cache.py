from django.core.cache import cache


class PortfolioCacheKeys:
    
    @staticmethod
    def portfolio(portfolio_id):
        return f"portfolio:{portfolio_id}"
    
    @staticmethod
    def main_image(portfolio_id):
        return f"portfolio:main_image:{portfolio_id}"
    
    @staticmethod
    def seo_data(portfolio_id):
        return f"portfolio:seo_data:{portfolio_id}"
    
    @staticmethod
    def seo_preview(portfolio_id):
        return f"portfolio:seo_preview:{portfolio_id}"
    
    @staticmethod
    def seo_completeness(portfolio_id):
        return f"portfolio:seo_completeness:{portfolio_id}"
    
    @staticmethod
    def structured_data(portfolio_id):
        return f"portfolio:structured_data:{portfolio_id}"
    
    @staticmethod
    def seo_report():
        return "portfolio:seo_report"
    
    @staticmethod
    def all_keys(portfolio_id):
        return [
            PortfolioCacheKeys.portfolio(portfolio_id),
            PortfolioCacheKeys.main_image(portfolio_id),
            PortfolioCacheKeys.seo_data(portfolio_id),
            PortfolioCacheKeys.seo_preview(portfolio_id),
            PortfolioCacheKeys.seo_completeness(portfolio_id),
            PortfolioCacheKeys.structured_data(portfolio_id),
        ]


class PortfolioCacheManager:
    
    @staticmethod
    def invalidate_portfolio(portfolio_id):
        cache_keys = PortfolioCacheKeys.all_keys(portfolio_id)
        additional_keys = [
            f"portfolio:{portfolio_id}:main_image_details",
            f"portfolio:{portfolio_id}:media_list",
            f"portfolio:{portfolio_id}:media_detail",
        ]
        cache_keys.extend(additional_keys)
        cache.delete_many(cache_keys)
    
    @staticmethod
    def invalidate_portfolios(portfolio_ids):
        all_keys = []
        for pid in portfolio_ids:
            all_keys.extend(PortfolioCacheKeys.all_keys(pid))
            additional_keys = [
                f"portfolio:{pid}:main_image_details",
                f"portfolio:{pid}:media_list",
                f"portfolio:{pid}:media_detail",
            ]
            all_keys.extend(additional_keys)
        if all_keys:
            cache.delete_many(all_keys)


class CategoryCacheKeys:
    
    @staticmethod
    def root_categories():
        return "portfolio_root_categories"
    
    @staticmethod
    def tree_admin():
        return "portfolio_category_tree_admin"
    
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
        return f"portfolio_tag_{tag_id}"
    
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


class OptionCacheKeys:
    
    @staticmethod
    def option(option_id):
        return f"portfolio_option_{option_id}"
    
    @staticmethod
    def popular():
        return "popular_options"
    
    @staticmethod
    def all_keys(option_ids=None):
        keys = [OptionCacheKeys.popular()]
        if option_ids:
            keys.extend([OptionCacheKeys.option(oid) for oid in option_ids])
        return keys


class OptionCacheManager:
    
    @staticmethod
    def invalidate_option(option_id):
        cache.delete(OptionCacheKeys.option(option_id))
        cache.delete(OptionCacheKeys.popular())
    
    @staticmethod
    def invalidate_options(option_ids):
        keys = OptionCacheKeys.all_keys(option_ids)
        if keys:
            cache.delete_many(keys)
    
    @staticmethod
    def invalidate_all():
        cache.delete(OptionCacheKeys.popular())